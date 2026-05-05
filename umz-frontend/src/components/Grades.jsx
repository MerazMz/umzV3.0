import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Search, SlidersHorizontal, X, GraduationCap, Tag, Star, Filter, ChevronDown, Check, FileText, LayoutGrid, ChevronLeft } from 'lucide-react';
import Sidebar from './Sidebar';
import { getCourses, getResult, getMarks } from '../services/api';

/* Grade colour mapping */
const gradeConfig = (g) => {
    const map = {
        'O':  { text: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', accent: 'bg-violet-500' },
        'A+': { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', accent: 'bg-emerald-500' },
        'A':  { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', accent: 'bg-blue-500' },
        'B+': { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', accent: 'bg-amber-500' },
        'B':  { text: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', accent: 'bg-orange-500' },
        'C+': { text: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100', accent: 'bg-pink-500' },
        'C':  { text: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', accent: 'bg-rose-500' },
        'D':  { text: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100', accent: 'bg-gray-400' },
        'E':  { text: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', accent: 'bg-red-500' },
        'F':  { text: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', accent: 'bg-red-600' },
    };
    return map[g] || { text: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100', accent: 'bg-gray-300' };
};

const grades = ['O', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'E', 'F'];

const Grades = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isMarksPath = location.pathname === '/marks';

    const [courses, setCourses]       = useState([]);
    const [resultData, setResultData] = useState(null);
    const [marksData, setMarksData]   = useState([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState('');
    
    // Persist View State
    const [search, setSearch]         = useState(() => localStorage.getItem('umz_grades_search') || '');
    const [activeSem, setActiveSem]   = useState(() => localStorage.getItem('umz_grades_active_sem') || '');
    const [viewMode, setViewMode]     = useState(() => {
        if (isMarksPath) return 'marks';
        return localStorage.getItem('umz_grades_view_mode') || 'grades';
    });
    const [selectedGrades, setSelectedGrades] = useState(() => {
        try { return JSON.parse(localStorage.getItem('umz_grades_selected')) || []; }
        catch { return []; }
    });

    const [showGradePicker, setShowGradePicker] = useState(false);
    const [studentInfo, setStudentInfo] = useState(null);
    const tabRefs = useRef({});

    // Save state to localStorage
    useEffect(() => { localStorage.setItem('umz_grades_search', search); }, [search]);
    useEffect(() => { if (activeSem) localStorage.setItem('umz_grades_active_sem', activeSem); }, [activeSem]);
    useEffect(() => { localStorage.setItem('umz_grades_view_mode', viewMode); }, [viewMode]);
    useEffect(() => { localStorage.setItem('umz_grades_selected', JSON.stringify(selectedGrades)); }, [selectedGrades]);

    useEffect(() => {
        const load = async () => {
            const si = localStorage.getItem('umz_student_info');
            if (si) { try { setStudentInfo(JSON.parse(si)); } catch {} }

            const cookies = localStorage.getItem('umz_cookies');

            // Load Results/Grades
            const cachedResult = localStorage.getItem('umz_result_data');
            if (cachedResult) {
                try { setResultData(JSON.parse(cachedResult)); } catch {}
            } else if (cookies) {
                try {
                    const res = await getResult(cookies);
                    setResultData(res.data);
                    localStorage.setItem('umz_result_data', JSON.stringify(res.data));
                } catch (e) { console.warn('Result fetch failed:', e.message); }
            }

            // Load Marks
            const cachedMarks = localStorage.getItem('umz_marks_data');
            if (cachedMarks) {
                try { setMarksData(JSON.parse(cachedMarks)); } catch {}
            } else if (cookies) {
                try {
                    const res = await getMarks(cookies);
                    setMarksData(res.data || []);
                    localStorage.setItem('umz_marks_data', JSON.stringify(res.data || []));
                } catch (e) { console.warn('Marks fetch failed:', e.message); }
            }

            // Load Courses (still needed to match attendance in grades view)
            const cachedCourses = localStorage.getItem('umz_courses_data');
            if (cachedCourses) {
                try { setCourses(JSON.parse(cachedCourses)); setLoading(false); }
                catch { localStorage.removeItem('umz_courses_data'); setLoading(false); }
            } else if (cookies) {
                try {
                    const result = await getCourses(cookies);
                    setCourses(result.data);
                    localStorage.setItem('umz_courses_data', JSON.stringify(result.data));
                } catch (err) { console.error('Course fetch failed:', err.message); }
                finally { setLoading(false); }
            } else {
                setLoading(false);
            }
        };
        load();
    }, []);

    const termMapping = React.useMemo(() => {
        if (!resultData?.semesters) return {};
        const sortedTermIds = [...new Set(resultData.semesters.map(s => s.termId))].sort((a, b) => a - b);
        const mapping = {};
        sortedTermIds.forEach((id, idx) => {
            mapping[id] = `Sem ${idx + 1}`;
        });
        return mapping;
    }, [resultData]);

    const allSubjects = React.useMemo(() => {
        if (!resultData) return [];
        const rows = [];
        
        (resultData.semesters || []).forEach(sem => {
            (sem.subjects || []).forEach(sub => {
                const matchedCourse = courses.find(c =>
                    c.courseCode && sub.code &&
                    c.courseCode.toLowerCase().includes(sub.code.toLowerCase().split('-')[0])
                );
                
                // Find marks for this subject
                const termMarks = (marksData || []).find(tm => String(tm.termId) === String(sem.termId));
                const subMarks = termMarks?.subjects?.find(ms => 
                    ms.courseCode && sub.code &&
                    ms.courseCode.toLowerCase().includes(sub.code.toLowerCase().split('-')[0])
                );

                const termInfo = (studentInfo?.TermwiseCGPA || []).find(t => String(t.term) === String(sem.termId));
                const mappedTitle = termMapping[sem.termId] || `Sem ${sem.termId}`;

                rows.push({
                    name: sub.name || subMarks?.courseName || '',
                    code: sub.code || subMarks?.courseCode || '',
                    credit: sub.credit,
                    grade: sub.grade || '—',
                    termId: sem.termId,
                    termTitle: mappedTitle,
                    attendance: matchedCourse?.attendance || null,
                    type: 'semester',
                    tgpa: sem.tgpa || termInfo?.tgpa || '—',
                    cgpa: termInfo?.cgpa || '—',
                    marks: subMarks?.marksBreakdown || []
                });
            });
        });

        (resultData.rplGrades || []).forEach(grp => {
            (grp.subjects || []).forEach(sub => {
                const mappedTitle = termMapping[grp.termId] ? `RPL — ${termMapping[grp.termId]}` : `RPL — Sem ${grp.termId}`;
                
                // Find marks for this RPL subject
                const termMarks = (marksData || []).find(tm => String(tm.termId) === String(grp.termId));
                const subMarks = termMarks?.subjects?.find(ms => 
                    ms.courseCode && sub.code &&
                    ms.courseCode.toLowerCase().includes(sub.code.toLowerCase().split('-')[0])
                );

                rows.push({
                    name: sub.name || subMarks?.courseName || '',
                    code: sub.code || subMarks?.courseCode || '',
                    credit: sub.credit,
                    grade: sub.grade || '—',
                    termId: grp.termId,
                    termTitle: mappedTitle,
                    attendance: null,
                    type: 'rpl',
                    tgpa: null,
                    cgpa: null,
                    marks: subMarks?.marksBreakdown || []
                });
            });
        });

        return rows;
    }, [resultData, courses, studentInfo, termMapping, marksData]);

    const semList = React.useMemo(() => {
        if (allSubjects.length === 0) return [];
        const titles = [...new Set(allSubjects.map(s => s.termTitle))];
        titles.sort((a, b) => {
            const isRplA = a.includes('RPL');
            const isRplB = b.includes('RPL');
            if (isRplA && !isRplB) return 1;
            if (!isRplA && isRplB) return -1;
            const numA = parseInt(a.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.match(/\d+/)?.[0] || '0');
            return numB - numA;
        });
        return titles;
    }, [allSubjects]);

    useEffect(() => {
        if (!activeSem && semList.length > 0) {
            setActiveSem(semList[0]);
        }
    }, [semList, activeSem]);

    useEffect(() => {
        if (activeSem && tabRefs.current[activeSem]) {
            tabRefs.current[activeSem].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [activeSem]);

    const groupedFiltered = React.useMemo(() => {
        const filtered = allSubjects.filter(s => {
            const matchSem = s.termTitle === activeSem;
            const matchSearch = !search ||
                s.name.toLowerCase().includes(search.toLowerCase()) ||
                s.code.toLowerCase().includes(search.toLowerCase());
            const matchGrade = viewMode === 'marks' || selectedGrades.length === 0 || selectedGrades.includes(s.grade);
            return matchSem && matchSearch && matchGrade;
        });

        const groupsMap = {};
        filtered.forEach(s => {
            if (!groupsMap[s.termTitle]) groupsMap[s.termTitle] = [];
            groupsMap[s.termTitle].push(s);
        });

        return Object.keys(groupsMap).map(title => ({
            title,
            subjects: groupsMap[title],
            type: groupsMap[title][0].type,
            tgpa: groupsMap[title][0].tgpa,
            cgpa: groupsMap[title][0].cgpa,
            termId: groupsMap[title][0].termId
        }));
    }, [allSubjects, activeSem, search, selectedGrades, viewMode]);

    const toggleGrade = (g) => {
        setSelectedGrades(prev => 
            prev.includes(g) ? prev.filter(item => item !== g) : [...prev, g]
        );
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-gray-800 dark:border-white border-r-transparent" />
                        <p className="mt-3 text-sm text-gray-400">Loading records…</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-plus-jakarta">
            <Sidebar />

            <main className="flex-1 overflow-y-auto lg:p-0">
                <div className="lg:hidden flex flex-col min-h-full">
                    {/* Top bar */}
                    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl active:bg-gray-100 dark:active:bg-gray-800 transition-colors">
                            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <h1 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">{isMarksPath ? 'Marks Section' : 'Grades Section'}</h1>
                        <div className="w-9" />
                    </div>

                    {/* Body */}
                    <div className="flex-1 pb-24">
                        {/* View Switcher & Search */}
                        <div className="px-4 pt-4 pb-2 space-y-3">
                            {/* Segmented Control */}
                            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                                <button 
                                    onClick={() => setViewMode('grades')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold transition-all ${viewMode === 'grades' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}
                                >
                                    <LayoutGrid className="h-3.5 w-3.5" />
                                    Grades
                                </button>
                                <button 
                                    onClick={() => setViewMode('marks')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold transition-all ${viewMode === 'marks' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}
                                >
                                    <FileText className="h-3.5 w-3.5" />
                                    Marks
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="relative">
                                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-3 py-2.5 shadow-sm">
                                        <Search className="h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder={`Search ${viewMode === 'grades' ? 'grades' : 'marks'}…`}
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            className="flex-1 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                                        />
                                        {search && (
                                            <button onClick={() => setSearch('')} className="p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <X className="h-3.5 w-3.5 text-gray-400" />
                                            </button>
                                        )}
                                        {viewMode === 'grades' && (
                                            <button 
                                                onClick={() => setShowGradePicker(!showGradePicker)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all ${showGradePicker || selectedGrades.length > 0 ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-400'}`}
                                            >
                                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                                    {selectedGrades.length > 0 ? `${selectedGrades.length} Grades` : 'Grade'}
                                                </span>
                                                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showGradePicker ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Grade Multi-Select Dropdown */}
                                    {showGradePicker && (
                                        <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                            <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-700/50 mb-1 flex items-center justify-between">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Select Grades</p>
                                                {selectedGrades.length > 0 && (
                                                    <button onClick={() => setSelectedGrades([])} className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">Clear</button>
                                                )}
                                            </div>
                                            <div className="max-h-64 overflow-y-auto no-scrollbar">
                                                <button onClick={() => { setSelectedGrades([]); setShowGradePicker(false); }} className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-colors ${selectedGrades.length === 0 ? 'text-blue-600 bg-blue-50/50' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>All Records</button>
                                                {grades.map(g => (
                                                    <button key={g} onClick={() => toggleGrade(g)} className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-colors flex items-center justify-between ${selectedGrades.includes(g) ? 'text-blue-600 bg-blue-50/50' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                                        <span>Grade {g}</span>
                                                        <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${selectedGrades.includes(g) ? 'bg-blue-600 border-blue-600' : 'border-gray-200 dark:border-gray-600'}`}>
                                                            {selectedGrades.includes(g) && <Check className="h-2.5 w-2.5 text-white stroke-[4px]" />}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="px-3 pt-2 mt-1 border-t border-gray-50 dark:border-gray-700/50">
                                                <button onClick={() => setShowGradePicker(false)} className="w-full py-2 bg-gray-900 dark:bg-gray-700 text-white text-[10px] font-bold uppercase rounded-xl tracking-widest shadow-lg shadow-gray-200 dark:shadow-none">Apply Filters</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {showGradePicker && <div className="fixed inset-0 z-40" onClick={() => setShowGradePicker(false)} />}

                                {selectedGrades.length > 0 && !showGradePicker && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-full w-fit animate-in fade-in duration-300 shadow-sm">
                                        <Filter className="h-2.5 w-2.5 text-blue-400" />
                                        <span className="text-[9px] font-bold uppercase tracking-wider">{selectedGrades.length === 1 ? `Filtered: Grade ${selectedGrades[0]}` : `${selectedGrades.length} Grades Active`}</span>
                                        <button onClick={() => setSelectedGrades([])} className="ml-1 p-0.5 hover:bg-white/10 rounded-full transition-colors"><X className="h-2.5 w-2.5" /></button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        {allSubjects.length > 0 && (
                            <div className="px-4 pb-3">
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 pt-1">
                                    {semList.map(sem => (
                                        <button
                                            key={sem}
                                            ref={el => tabRefs.current[sem] = el}
                                            onClick={() => setActiveSem(sem)}
                                            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                                activeSem === sem
                                                    ? 'bg-gray-900 text-white shadow-md shadow-gray-200 dark:shadow-none'
                                                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500'
                                            }`}
                                        >
                                            {sem}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        <div className="px-4 space-y-6">
                            {allSubjects.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-12 flex flex-col items-center gap-2 text-center">
                                    <BookOpen className="h-7 w-7 text-gray-200 dark:text-gray-700" />
                                    <p className="text-sm font-medium text-gray-400">No records found</p>
                                </div>
                            ) : groupedFiltered.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-12 flex flex-col items-center gap-2 text-center">
                                    <BookOpen className="h-7 w-7 text-gray-200 dark:text-gray-700" />
                                    <p className="text-sm font-medium text-gray-400">No results match your search</p>
                                    <button 
                                        onClick={() => { setSelectedGrades([]); setSearch(''); }}
                                        className="mt-2 text-[11px] font-bold text-blue-500 underline"
                                    >
                                        Reset all filters
                                    </button>
                                </div>
                            ) : (
                                groupedFiltered.map((group, gIdx) => {
                                    const totalCredits = group.subjects.reduce((sum, s) => sum + (s.credit || 0), 0);
                                    return (
                                        <div key={group.title} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            {/* Stats Card */}
                                            {viewMode === 'grades' && group.type !== 'rpl' && group.tgpa && selectedGrades.length === 0 && (
                                                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-5 text-white shadow-lg shadow-gray-200 dark:shadow-none relative overflow-hidden">
                                                    <div className="relative z-10 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Term Performance</p>
                                                            <h3 className="text-3xl font-black">{group.tgpa} <span className="text-sm font-medium text-gray-400">TGPA</span></h3>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                                            <p className="text-lg font-bold">{group.termId}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-gray-400">
                                                        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {group.subjects.length} Subjects</span>
                                                        <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {totalCredits.toFixed(1)} Credits</span>
                                                    </div>
                                                    <GraduationCap className="absolute -right-4 -bottom-4 h-24 w-24 text-white opacity-5 rotate-12" />
                                                </div>
                                            )}

                                            {/* Subject Cards */}
                                            <div className="space-y-3">
                                                {group.subjects.map((sub, idx) => {
                                                    const cfg = gradeConfig(sub.grade);
                                                    
                                                    // Render Marks View
                                                    if (viewMode === 'marks') {
                                                        const totalObtained = sub.marks.reduce((sum, m) => {
                                                            const weightageMatch = m.weightage.match(/(\d+\.?\d*)/);
                                                            return sum + (weightageMatch ? parseFloat(weightageMatch[1]) : 0);
                                                        }, 0);

                                                        return (
                                                            <div key={`${gIdx}-${idx}`} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100/80 dark:border-gray-700/50 p-4 shadow-sm animate-in fade-in duration-300">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        {sub.name && sub.name !== 'N/A' && (
                                                                            <span className="px-1.5 py-0.5 rounded bg-gray-50 dark:bg-gray-700/50 text-[9px] font-bold text-gray-400 dark:text-gray-500 font-mono tracking-tight">{sub.code}</span>
                                                                        )}
                                                                        <h4 className="text-[13px] font-bold text-gray-800 dark:text-gray-100 truncate mt-0.5">{sub.name && sub.name !== 'N/A' ? sub.name : sub.code}</h4>
                                                                    </div>
                                                                    <div className="text-right ml-4">
                                                                        <p className="text-xl font-black text-gray-900 dark:text-white">{totalObtained}<span className="text-[10px] text-gray-400 font-bold">/100</span></p>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-700/50">
                                                                    {sub.marks.length > 0 ? (
                                                                        <>
                                                                            <div className="grid grid-cols-[1fr_80px_60px] gap-3 px-1 mb-2.5">
                                                                                <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-left">Assessment Type</span>
                                                                                <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Obtained</span>
                                                                                <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Weightage</span>
                                                                            </div>
                                                                            <div className="space-y-2.5">
                                                                                {sub.marks.map((m, mIdx) => (
                                                                                    <div key={mIdx} className="grid grid-cols-[1fr_80px_60px] gap-3 items-center">
                                                                                        <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 truncate leading-none text-left">{m.type}</span>
                                                                                        <span className="text-[10px] font-black text-gray-900 dark:text-white text-center leading-none">{m.marks}</span>
                                                                                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 text-right leading-none">{m.weightage}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <div className="flex flex-col items-center justify-center py-2 gap-1 opacity-40">
                                                                            <FileText className="h-4 w-4 text-gray-400" />
                                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">No marks breakdown available</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div
                                                            key={`${gIdx}-${idx}`}
                                                            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100/80 dark:border-gray-700/50 p-4 flex items-center gap-4 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden group animate-in fade-in duration-300"
                                                        >
                                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.accent} opacity-80`} />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    {sub.name && sub.name !== 'N/A' && (
                                                                        <span className="px-1.5 py-0.5 rounded bg-gray-50 dark:bg-gray-700/50 text-[9px] font-bold text-gray-400 dark:text-gray-500 font-mono tracking-tight">{sub.code}</span>
                                                                    )}
                                                                    {sub.attendance && (
                                                                        <span className={`text-[9px] font-bold ${parseInt(sub.attendance) >= 75 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                            {sub.attendance}% Att.
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[13px] font-bold text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">
                                                                    {sub.name && sub.name !== 'N/A' ? sub.name : sub.code}
                                                                </p>
                                                                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                                                                    <Star className="h-2.5 w-2.5" /> {sub.credit?.toFixed(1) || '0.0'} Credits
                                                                </p>
                                                            </div>
                                                            <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${cfg.bg} flex flex-col items-center justify-center border ${cfg.border} transition-transform group-active:scale-95`}>
                                                                <span className={`text-base font-black ${cfg.text}`}>{sub.grade}</span>
                                                                <span className={`text-[8px] font-black uppercase opacity-60 ${cfg.text}`}>Grade</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* DESKTOP VIEW */}
                <div className="hidden lg:block max-w-5xl mx-auto px-6 lg:px-10 py-8 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Academic Records</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Results from all semesters</p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search grades…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 text-gray-900 dark:text-white placeholder-gray-400 w-56"
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/60">
                        {allSubjects.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())).map((sub, index) => {
                            const cfg = gradeConfig(sub.grade);
                            return (
                                <div key={index} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                    <div className="shrink-0 w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{sub.grade}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400 tracking-wide">{sub.code}</span>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500">·</span>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500">{sub.termTitle}</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{sub.name}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{sub.credit} Credits</p>
                                        <span className={`text-[10px] font-bold ${cfg.text}`}>Grade {sub.grade}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Grades;
