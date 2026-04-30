import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Info, Calculator, BookOpen, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import Sidebar from './Sidebar';
import { getStudentInfo, getResult } from '../services/api';
import TPGACalculator from './TPGACalculator';
import OverallCGPACalculator from './OverallCGPACalculator';

const gradeColors = {
    'O':  'bg-violet-100 text-violet-800',
    'A+': 'bg-emerald-100 text-emerald-800',
    'A':  'bg-blue-100 text-blue-800',
    'B+': 'bg-amber-100 text-amber-800',
    'B':  'bg-orange-100 text-orange-800',
    'C+': 'bg-pink-100 text-pink-800',
    'C':  'bg-rose-100 text-rose-800',
    'D':  'bg-gray-200 text-gray-700',
    'E':  'bg-red-100 text-red-700',
    'F':  'bg-red-200 text-red-800',
};
const gradeLabel = (g) => gradeColors[g] || 'bg-gray-100 text-gray-600';

const CGPA = () => {
    const navigate = useNavigate();
    const [studentInfo, setStudentInfo] = useState(null);
    const [resultData, setResultData] = useState(null);
    const [expandedTerms, setExpandedTerms] = useState({});
    const [loading, setLoading] = useState(true);
    const [resultLoading, setResultLoading] = useState(false);
    const [error, setError] = useState('');
    const [hoveredGrade, setHoveredGrade] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [activeTab, setActiveTab] = useState(() => {
        const cachedTab = localStorage.getItem('umz_cgpa_active_tab');
        return cachedTab || 'view';
    });
    const [calcMode, setCalcMode] = useState(() => {
        return localStorage.getItem('umz_cgpa_calc_mode') || 'term';
    });

    const fetchResultData = async (force = false) => {
        if (!force) {
            const cached = localStorage.getItem('umz_result_data');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    setResultData(parsed);
                    const exp = {};
                    (parsed.semesters || []).forEach(s => { exp[s.termId] = false; });
                    (parsed.rplGrades || []).forEach(g => { exp['rpl_' + g.termId] = false; });
                    setExpandedTerms(exp);
                    return;
                } catch { localStorage.removeItem('umz_result_data'); }
            }
        }
        const cookies = localStorage.getItem('umz_cookies');
        if (!cookies) return;
        try {
            setResultLoading(true);
            const res = await getResult(cookies);
            setResultData(res.data);
            localStorage.setItem('umz_result_data', JSON.stringify(res.data));
            const exp = {};
            (res.data.semesters || []).forEach(s => { exp[s.termId] = false; });
            (res.data.rplGrades || []).forEach(g => { exp['rpl_' + g.termId] = false; });
            setExpandedTerms(exp);
        } catch (e) { console.error('Result fetch error:', e.message); }
        finally { setResultLoading(false); }
    };

    useEffect(() => {
        const fetchData = async () => {
            const cachedInfo = localStorage.getItem('umz_student_info');
            if (cachedInfo) {
                try {
                    setStudentInfo(JSON.parse(cachedInfo));
                    setLoading(false);
                } catch { localStorage.removeItem('umz_student_info'); }
            }
            const cookies = localStorage.getItem('umz_cookies');
            if (!cookies) { setLoading(false); return; }
            if (!cachedInfo) {
                try {
                    setLoading(true);
                    const result = await getStudentInfo(cookies);
                    setStudentInfo(result.data);
                    localStorage.setItem('umz_student_info', JSON.stringify(result.data));
                } catch (err) {
                    setError(err.message || 'Failed to load CGPA data');
                } finally { setLoading(false); }
            }
        };
        fetchData();
        fetchResultData();
    }, [navigate]);

    const toggleTerm = (id) => setExpandedTerms(prev => ({ ...prev, [id]: !prev[id] }));

    // Cache active tab preference
    useEffect(() => {
        localStorage.setItem('umz_cgpa_active_tab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        localStorage.setItem('umz_cgpa_calc_mode', calcMode);
    }, [calcMode]);

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-r-transparent" />
                        <p className="mt-4 text-sm text-gray-500">Loading CGPA data...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <main className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
                            <p className="text-gray-600">{error}</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">CGPA Analysis</h1>
                            <p className="text-gray-500">Your academic performance across all semesters</p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
                        <button
                            onClick={() => setActiveTab('view')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'view'
                                ? 'bg-gray-900 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Info className="h-4 w-4" />
                            CGPA View
                        </button>
                        <button
                            onClick={() => setActiveTab('calculator')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'calculator'
                                ? 'bg-gray-900 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Calculator className="h-4 w-4" />
                            Calculator Mode
                        </button>
                    </div>

                    {/* Conditional rendering based on active tab */}
                    {activeTab === 'view' ? (
                        <>
                            {/* CGPA Card and Grade Distribution Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                {/* Overall CGPA Card */}
                                <div className="lg:col-span-1 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl p-8 text-white flex flex-col justify-center">
                                    <p className="text-sm font-medium opacity-90 mb-2">Current CGPA</p>
                                    <p className="text-5xl font-bold mb-2">{studentInfo?.CGPA || 'N/A'}</p>
                                    <p className="text-sm opacity-75">Out of 10.0</p>
                                </div>

                                {/* Grade Distribution Pie Chart */}
                                {(() => {
                                    // Collect all subjects with grades from all semesters
                                    const gradeMap = {};
                                    (studentInfo?.TermwiseCGPA || []).forEach(semester => {
                                        if (semester.subjects && semester.subjects.length > 0) {
                                            semester.subjects.forEach(subject => {
                                                const grade = subject.grade;
                                                const [code, ...nameParts] = subject.course.split('::');
                                                const courseName = nameParts.join('::').trim();

                                                if (!gradeMap[grade]) {
                                                    gradeMap[grade] = [];
                                                }
                                                gradeMap[grade].push({
                                                    code: code?.trim(),
                                                    name: courseName
                                                });
                                            });
                                        }
                                    });

                                    // Sort grades in descending order (A+, A, B+, B, C+, etc.)
                                    const gradeOrder = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'E', 'F'];
                                    const sortedGrades = Object.keys(gradeMap).sort((a, b) => {
                                        const indexA = gradeOrder.indexOf(a);
                                        const indexB = gradeOrder.indexOf(b);
                                        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                                        if (indexA === -1) return 1;
                                        if (indexB === -1) return -1;
                                        return indexA - indexB;
                                    });

                                    const gradeData = sortedGrades.map(grade => ({
                                        grade,
                                        count: gradeMap[grade].length,
                                        subjects: gradeMap[grade]
                                    }));

                                    // Define colors for each grade
                                    const gradeColors = {
                                        'O': '#915df2ff',
                                        'A+': '#10B981',
                                        'A': '#3B82F6',
                                        'B+': '#F59E0B',
                                        'B': '#EF4444',
                                        'C+': '#8B5CF6',
                                        'C': '#EC4899',
                                        'D': '#6B7280',
                                        'E': '#9CA3AF',
                                        'F': '#4B5563'
                                    };

                                    if (gradeData.length === 0) return null;

                                    return (
                                        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-6">
                                                Grade Distribution
                                            </h3>
                                            <div className="flex flex-col md:flex-row items-center gap-6">
                                                {/* Pie Chart */}
                                                <div className="relative">
                                                    <ResponsiveContainer width={200} height={200}>
                                                        <PieChart>
                                                            <Pie
                                                                data={gradeData}
                                                                cx="50%"
                                                                cy="50%"
                                                                outerRadius={80}
                                                                dataKey="count"
                                                                isAnimationActive={false}
                                                            >
                                                                {gradeData.map((entry, index) => (
                                                                    <Cell
                                                                        key={`cell-${index}`}
                                                                        fill={gradeColors[entry.grade] || '#6B7280'}
                                                                        opacity={hoveredGrade === null || hoveredGrade === entry.grade ? 1 : 0.3}
                                                                    />
                                                                ))}
                                                            </Pie>
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>

                                                {/* Legend Grid */}
                                                <div className="flex-1 self-center">
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                        {gradeData.map((item, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                                                onMouseEnter={(e) => {
                                                                    setHoveredGrade(item.grade);
                                                                    setMousePosition({ x: e.clientX, y: e.clientY });
                                                                }}
                                                                onMouseMove={(e) => {
                                                                    setMousePosition({ x: e.clientX, y: e.clientY });
                                                                }}
                                                                onMouseLeave={() => {
                                                                    setHoveredGrade(null);
                                                                }}
                                                            >
                                                                <div
                                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                                    style={{
                                                                        backgroundColor: gradeColors[item.grade] || '#6B7280',
                                                                        opacity: hoveredGrade === null || hoveredGrade === item.grade ? 1 : 0.3
                                                                    }}
                                                                />
                                                                <span className="text-xs text-gray-700 font-medium">
                                                                    {item.grade} ({item.count})
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Floating Subject List Tooltip */}
                                                {hoveredGrade && (
                                                    <div
                                                        className="fixed z-50 pointer-events-none"
                                                        style={{
                                                            left: `${mousePosition.x + 15}px`,
                                                            top: `${mousePosition.y + 15}px`
                                                        }}
                                                    >
                                                        <div className="bg-gray-900 text-white rounded-lg shadow-2xl p-4 max-w-xs">
                                                            <p className="text-sm font-semibold mb-3 pb-2 border-b border-gray-700">
                                                                Grade {hoveredGrade} - {gradeData.find(g => g.grade === hoveredGrade)?.subjects.length} {gradeData.find(g => g.grade === hoveredGrade)?.subjects.length === 1 ? 'Subject' : 'Subjects'}
                                                            </p>
                                                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                                                {gradeData.find(g => g.grade === hoveredGrade)?.subjects.map((subject, idx) => (
                                                                    <div key={idx} className="text-xs text-gray-200 flex items-start gap-2">
                                                                        <span className="text-gray-400">•</span>
                                                                        <span className="flex-1">{subject.name}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>


                            {/* Semester Performance Chart */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                                    TGPA Progression
                                </h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart
                                        data={(studentInfo?.TermwiseCGPA || []).map(t => ({
                                            term: `Sem ${t.term}`,
                                            tgpa: parseFloat(t.tgpa)
                                        }))}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="term"
                                            tick={{ fontSize: 12, fill: '#6B7280' }}
                                        />
                                        <YAxis
                                            domain={[0, 10]}
                                            tick={{ fontSize: 12, fill: '#6B7280' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1F2937',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '12px'
                                            }}
                                            labelStyle={{ color: 'white' }}
                                            itemStyle={{ color: 'white' }}
                                        />
                                        <Bar
                                            dataKey="tgpa"
                                            fill="#111827ff"
                                            radius={[8, 8, 0, 0]}
                                            isAnimationActive={false}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Result Accordion */}
                            {resultLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-r-transparent" />
                                    <span className="ml-3 text-sm text-gray-500">Loading result data...</span>
                                </div>
                            ) : resultData ? (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Term-wise Result</h3>
                                    {(resultData.semesters || []).map(sem => {
                                        const isOpen = expandedTerms[sem.termId];
                                        const totalCredits = (sem.subjects || []).reduce((a, s) => a + (s.credit || 0), 0);
                                        return (
                                            <div key={sem.termId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                                <button onClick={() => toggleTerm(sem.termId)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center"><BookOpen className="w-5 h-5 text-white" /></div>
                                                        <div className="text-left">
                                                            <p className="font-semibold text-gray-900">Term {sem.termId}</p>
                                                            <p className="text-xs text-gray-500">{(sem.subjects||[]).length} subjects · {totalCredits.toFixed(1)} credits</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {sem.tgpa && <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded-lg text-sm font-bold">TGPA {sem.tgpa}</span>}
                                                        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                                    </div>
                                                </button>
                                                {isOpen && (
                                                    <div className="border-t border-gray-100">
                                                        <div className="grid grid-cols-12 px-6 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                            <div className="col-span-2">Code</div><div className="col-span-7">Course Name</div>
                                                            <div className="col-span-1 text-center">Cr.</div><div className="col-span-2 text-center">Grade</div>
                                                        </div>
                                                        {(sem.subjects || []).map((sub, idx) => (
                                                            <div key={idx} className={`grid grid-cols-12 px-6 py-3 items-center text-sm border-t border-gray-50 hover:bg-gray-50 transition-colors ${idx%2===0?'':'bg-gray-50/50'}`}>
                                                                <div className="col-span-2 font-mono text-xs text-gray-500">{sub.code}</div>
                                                                <div className="col-span-7 font-medium text-gray-900 pr-4">{sub.name}</div>
                                                                <div className="col-span-1 text-center text-gray-600 text-xs">{sub.credit!=null?sub.credit.toFixed(1):'—'}</div>
                                                                <div className="col-span-2 text-center">{sub.grade?<span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold ${gradeLabel(sub.grade)}`}>{sub.grade}</span>:'—'}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {/* RPL Section */}
                                    {(resultData.rplGrades||[]).length > 0 && (
                                        <div className="space-y-4 pt-2">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-px bg-amber-200" />
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
                                                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                                                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">RPL Grades</span>
                                                </div>
                                                <div className="flex-1 h-px bg-amber-200" />
                                            </div>
                                            {(resultData.rplGrades||[]).map(grp => {
                                                const key = 'rpl_'+grp.termId;
                                                const isOpen = expandedTerms[key];
                                                return (
                                                    <div key={key} className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
                                                        <button onClick={() => toggleTerm(key)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-amber-50/50 transition-colors">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center"><Tag className="w-5 h-5 text-white" /></div>
                                                                <div className="text-left">
                                                                    <p className="font-semibold text-gray-900">RPL — Term {grp.termId}</p>
                                                                    <p className="text-xs text-gray-500">{grp.subjects.length} subject(s)</p>
                                                                </div>
                                                            </div>
                                                            {isOpen?<ChevronUp className="w-5 h-5 text-gray-400"/>:<ChevronDown className="w-5 h-5 text-gray-400"/>}
                                                        </button>
                                                        {isOpen && (
                                                            <div className="border-t border-amber-50">
                                                                <div className="grid grid-cols-12 px-6 py-2 bg-amber-50/60 text-xs font-semibold text-amber-700 uppercase tracking-wide">
                                                                    <div className="col-span-2">Code</div><div className="col-span-8">Course Name</div><div className="col-span-2 text-center">Grade</div>
                                                                </div>
                                                                {grp.subjects.map((sub,idx)=>(
                                                                    <div key={idx} className={`grid grid-cols-12 px-6 py-3 items-center text-sm border-t border-amber-50 ${idx%2===0?'':'bg-amber-50/20'}`}>
                                                                        <div className="col-span-2 font-mono text-xs text-gray-500">{sub.code}</div>
                                                                        <div className="col-span-8 font-medium text-gray-900 pr-4">{sub.name}</div>
                                                                        <div className="col-span-2 text-center">{sub.grade?<span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold ${gradeLabel(sub.grade)}`}>{sub.grade}</span>:'—'}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-400 text-sm">No result data available.</div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-6">
                            {/* Calculator sub-tab toggle */}
                            <div className="flex gap-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
                                <button
                                    onClick={() => setCalcMode('term')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                        calcMode === 'term'
                                            ? 'bg-gray-900 text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    📘 Term GPA (TGPA)
                                </button>
                                <button
                                    onClick={() => setCalcMode('overall')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                        calcMode === 'overall'
                                            ? 'bg-gray-900 text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    🎓 Overall CGPA
                                </button>
                            </div>

                            {calcMode === 'term' ? (
                                <TPGACalculator semesterData={studentInfo?.TermwiseCGPA || []} resultData={resultData} />
                            ) : (
                                <OverallCGPACalculator semesterData={studentInfo?.TermwiseCGPA || []} resultData={resultData} />
                            )}
                        </div>
                    )}
                </div>


            </main>
        </div>
    );
};

export default CGPA;