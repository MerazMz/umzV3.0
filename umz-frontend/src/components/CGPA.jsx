import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { X } from 'lucide-react';
import Sidebar from './Sidebar';
import { getStudentInfo } from '../services/api';

const CGPA = () => {
    const navigate = useNavigate();
    const [studentInfo, setStudentInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
    const [hoveredGrade, setHoveredGrade] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const fetchData = async () => {
            // First, always check for cached data
            const cachedInfo = localStorage.getItem('umz_student_info');
            if (cachedInfo) {
                try {
                    const parsed = JSON.parse(cachedInfo);
                    setStudentInfo(parsed);
                    setLoading(false);
                    return; // Use cache, don't fetch
                } catch {
                    localStorage.removeItem('umz_student_info');
                }
            }

            // No cache available - check if we have cookies
            const cookies = localStorage.getItem('umz_cookies');

            if (!cookies) {
                // No cookies and no cache - show empty state
                console.log('⚠️ No cookies and no cached student info');
                setLoading(false);
                setError('');
                setStudentInfo(null);
                return;
            }

            // We have cookies but no cache - fetch fresh data
            try {
                setLoading(true);
                const result = await getStudentInfo(cookies);
                setStudentInfo(result.data);
                localStorage.setItem('umz_student_info', JSON.stringify(result.data));
                setError('');
            } catch (err) {
                setError(err.message || 'Failed to load CGPA data');
                if (err.message?.includes('session') || err.message?.includes('unauthorized')) {
                    // Session expired - remove cookies
                    localStorage.removeItem('umz_cookies');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

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
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">CGPA Analysis</h1>
                        <p className="text-gray-500">Your academic performance across all semesters</p>
                    </div>

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

                    {/* Semester Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(studentInfo?.TermwiseCGPA || []).map((semester, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    setSelectedSemester(semester);
                                    setIsSemesterModalOpen(true);
                                }}
                                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-gray-900">
                                        Semester {semester.term}
                                    </h4>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded-lg text-sm font-bold">
                                        {semester.tgpa}
                                    </span>
                                </div>
                                {semester.subjects && semester.subjects.length > 0 && (
                                    <p className="text-xs text-gray-500">
                                        {semester.subjects.length} Courses
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Semester Detail Modal */}
                {isSemesterModalOpen && selectedSemester && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
                            {/* Modal Header */}
                            <div className="flex items-start justify-between p-6 border-b border-gray-200">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                        Semester {selectedSemester.term}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-sm text-gray-500">TGPA:</span>
                                        <span className="px-3 py-1 bg-gray-900 text-white rounded-lg text-sm font-bold">
                                            {selectedSemester.tgpa}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsSemesterModalOpen(false);
                                        setSelectedSemester(null);
                                    }}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <X className="h-6 w-6 text-gray-600" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {selectedSemester.subjects && selectedSemester.subjects.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedSemester.subjects.map((subject, idx) => {
                                            const [code, ...nameParts] = subject.course.split('::');
                                            const courseName = nameParts.join('::').trim();

                                            return (
                                                <div
                                                    key={idx}
                                                    className="bg-gray-50 rounded-xl p-4 flex items-start justify-between gap-4 hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-mono text-gray-500 mb-1">
                                                            {code?.trim()}
                                                        </p>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {courseName}
                                                        </p>
                                                    </div>
                                                    <span className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold flex-shrink-0">
                                                        {subject.grade}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        No subjects available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CGPA;