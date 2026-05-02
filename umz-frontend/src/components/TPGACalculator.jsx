import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RotateCcw } from 'lucide-react';

const gradePoints = {
    "O": 10, "o": 10,
    "A+": 9, "a+": 9,
    "A": 8, "a": 8,
    "B+": 7, "b+": 7,
    "B": 6, "b": 6,
    "C": 5, "c": 5,
    "D": 4, "d": 4,
    "E": 0, "e": 0,
    "F": 0, "f": 0,
};

const gradeOptions = ['O', 'A+', 'A', 'B+', 'B', 'C', 'D', 'E', 'F'];

const getGPAMessage = (gpa) => {
    if (gpa >= 9.0) return 'Outstanding! 🌟';
    if (gpa >= 8.0) return 'Excellent! 💫';
    if (gpa >= 7.0) return 'Very Good! ⭐';
    if (gpa >= 6.0) return 'Good! 👍';
    if (gpa >= 5.0) return 'Keep Going! 💪';
    return 'You Can Do It! 🎯';
};

const TPGACalculator = ({ semesterData = [], resultData = null }) => {
    const [subjects, setSubjects] = useState([]);
    const [result, setResult] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState('');
    const [manualCount, setManualCount] = useState('');
    const [editingCreditId, setEditingCreditId] = useState(null);

    // ── Cache ──────────────────────────────────────────────────────────────
    useEffect(() => {
        try {
            const cached = localStorage.getItem('umz_tgpa_calculator');
            if (cached) {
                const p = JSON.parse(cached);
                if (p.subjects?.length > 0) {
                    setSubjects(p.subjects);
                    setSelectedSemester(p.selectedSemester || '');
                    if (p.result) setResult(p.result);
                }
            }
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (subjects.length > 0) {
            localStorage.setItem('umz_tgpa_calculator', JSON.stringify({ subjects, result, selectedSemester }));
        }
    }, [subjects, result, selectedSemester]);

    // ── Semester select ────────────────────────────────────────────────────
    const handleSemesterSelect = (e) => {
        const termId = e.target.value;
        setSelectedSemester(termId);
        if (!termId) return;

        // 1. Try resultData (has exact credits)
        const resultSem = resultData?.semesters?.find(s => String(s.termId) === String(termId));
        if (resultSem?.subjects?.length > 0) {
            setSubjects(resultSem.subjects.map(sub => ({
                id: crypto.randomUUID(),
                courseCode: sub.code || '',
                courseName: sub.name || sub.code || 'Subject',
                grade: sub.grade || '',
                credit: sub.credit != null ? sub.credit.toString() : '',
            })));
            setResult(null);
            return;
        }

        // 2. Try umz_courses_data (Current Semester)
        const cachedCourses = localStorage.getItem('umz_courses_data');
        if (cachedCourses) {
            try {
                const parsed = JSON.parse(cachedCourses);
                const currentCourses = parsed.filter(c => String(c.term) === String(termId));
                if (currentCourses.length > 0) {
                    setSubjects(currentCourses.map(c => ({
                        id: crypto.randomUUID(),
                        courseCode: c.courseCode || '',
                        courseName: c.courseName || 'Subject',
                        grade: '',
                        credit: '', // Default to empty for new terms
                    })));
                    setResult(null);
                    return;
                }
            } catch (e) { console.error(e); }
        }

        // 3. Fallback: TermwiseCGPA
        const sem = semesterData.find(s => String(s.term) === String(termId));
        if (sem?.subjects?.length > 0) {
            setSubjects(sem.subjects.map(subject => {
                const [code, ...nameParts] = subject.course.split('::');
                return {
                    id: crypto.randomUUID(),
                    courseCode: code?.trim() || '',
                    courseName: nameParts.join('::').trim() || code?.trim() || 'Subject',
                    grade: subject.grade || '',
                    credit: subject.credit?.toString() || '',
                };
            }));
            setResult(null);
        }
    };

    // ── Manual add ────────────────────────────────────────────────────────
    const handleGenerateManual = () => {
        const n = parseInt(manualCount);
        if (!n || n < 1 || n > 20) return;
        setSubjects(Array.from({ length: n }, () => ({
            id: crypto.randomUUID(), courseCode: '', courseName: '', grade: '', credit: ''
        })));
        setSelectedSemester('');
        setResult(null);
        setManualCount('');
    };

    const handleAdd = () => {
        setSubjects(prev => [...prev, { id: crypto.randomUUID(), courseCode: '', courseName: '', grade: '', credit: '' }]);
        setResult(null);
    };

    const handleRemove = (id) => setSubjects(prev => prev.filter(s => s.id !== id));

    const handleChange = (id, field, value) => {
        setSubjects(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
        setResult(null);
    };

    // ── Calculate ─────────────────────────────────────────────────────────
    const handleCalculate = () => {
        let totalPoints = 0, totalCredits = 0;
        for (let i = 0; i < subjects.length; i++) {
            const grade = subjects[i].grade.trim().toUpperCase();
            const credit = parseFloat(subjects[i].credit);
            if (!grade || isNaN(credit)) { alert(`Fill all fields for subject ${i + 1}`); return; }
            if (!Object.prototype.hasOwnProperty.call(gradePoints, grade)) { alert(`Invalid grade "${grade}" for subject ${i + 1}`); return; }
            totalPoints += gradePoints[grade] * credit;
            totalCredits += credit;
        }
        if (totalCredits === 0) { alert('Total credits cannot be zero'); return; }
        const gpa = Math.round((totalPoints / totalCredits) * 100) / 100;
        setResult({ gpa, message: getGPAMessage(gpa) });
    };

    const handleReset = () => {
        setSubjects([]);
        setResult(null);
        setSelectedSemester('');
        setManualCount('');
        localStorage.removeItem('umz_tgpa_calculator');
    };

    // ── Semester options ───────────────────────────────────────────────────
    const romanize = (num) => {
        const lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
        let roman = '', i;
        for (i in lookup) {
            while (num >= lookup[i]) {
                roman += i;
                num -= lookup[i];
            }
        }
        return roman;
    };

    const getSemesterOptions = () => {
        const options = new Map();
        const allTermIds = new Set();

        (resultData?.semesters || []).forEach(s => allTermIds.add(String(s.termId)));
        (semesterData || []).forEach(s => {
            if (String(s.term).length > 3) allTermIds.add(String(s.term));
        });
        try {
            const cachedCourses = localStorage.getItem('umz_courses_data');
            if (cachedCourses) {
                JSON.parse(cachedCourses).forEach(c => {
                    if (c.term) allTermIds.add(String(c.term));
                });
            }
        } catch (e) { /* ignore */ }
        // 2. Sort term IDs chronologically based on the last 5 digits (Year + Term)
        const getSortValue = (id) => {
            const str = String(id);
            if (/^\d+$/.test(str) && str.length >= 5) {
                return parseInt(str.slice(-5), 10);
            }
            return parseInt(str, 10) || 0;
        };
        const sortedTermIds = Array.from(allTermIds).sort((a, b) => getSortValue(a) - getSortValue(b));

        // 3. Create a map of Term ID -> Semester Number (Roman)
        const termToRoman = {};
        sortedTermIds.forEach((id, index) => {
            termToRoman[id] = romanize(index + 1);
        });

        // 4. Build options
        const maxTermId = sortedTermIds[sortedTermIds.length - 1];

        sortedTermIds.forEach(id => {
            let label = `Semester ${termToRoman[id]} (${id})`;
            
            // Try to find TGPA from results
            const resultSem = resultData?.semesters?.find(s => String(s.termId) === id);
            if (resultSem) {
                label += resultSem.tgpa ? ` — TGPA ${resultSem.tgpa}` : ' — Ongoing';
            } else {
                // Try to find TGPA from dashboard data
                const dashSem = semesterData?.find(s => String(s.term) === id);
                if (dashSem) {
                    label += dashSem.tgpa ? ` — TGPA ${dashSem.tgpa}` : ' — N/A';
                } else {
                    label += ' — Current';
                }
            }

            options.set(id, { value: id, label });
        });

        // Return sorted descending (latest first)
        return Array.from(options.values()).sort((a, b) => getSortValue(b.value) - getSortValue(a.value));
    };

    const semesterOptions = getSemesterOptions();

    const hasSubjects = subjects.length > 0;

    return (
        <div className="space-y-5">

            {/* ── Top bar: semester picker + manual + reset ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-wrap items-end gap-4">

                {/* Semester */}
                {semesterOptions.length > 0 && (
                    <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
                        <label className="text-xs font-medium text-gray-500">
                            Auto-fill from semester
                        </label>
                        <select
                            value={selectedSemester}
                            onChange={handleSemesterSelect}
                            className="h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        >
                            <option value="">Choose semester…</option>
                            {semesterOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Manual */}
                <div className="flex items-end gap-2">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-500">
                            Manual subjects
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={manualCount}
                            onChange={e => setManualCount(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleGenerateManual()}
                            placeholder="e.g. 6"
                            className="h-10 px-3 min-w-[350px] border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                    </div>

                    <button
                        onClick={handleGenerateManual}
                        className="h-10 px-15 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition"
                    >
                        Generate
                    </button>
                </div>

                {/* Reset */}
                {hasSubjects && (
                    <button
                        onClick={handleReset}
                        className="h-10 px-4 flex items-center gap-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition ml-auto"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </button>
                )}

            </div>

            {/* ── Subject Cards Grid ── */}
            {hasSubjects && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {subjects.map((sub, idx) => (
                        <div
                            key={sub.id}
                            className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-5 relative hover:shadow-md transition"
                        >
                            {/* Remove */}
                            <button
                                onClick={() => handleRemove(sub.id)}
                                className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Header */}
                            <div className="flex items-start gap-3 pr-8">
                                <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold">
                                    {idx + 1}
                                </div>

                                <div className="flex-1 min-w-0">
                                    {sub.courseCode && (
                                        <p className="text-[11px] text-gray-400 font-mono mb-0.5">
                                            {sub.courseCode}
                                        </p>
                                    )}
                                    <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">
                                        {sub.courseName || "Subject"}
                                    </p>
                                </div>
                            </div>

                            {/* Middle row: credits + grade */}
                            <div className="flex items-end justify-between gap-3">
                                {/* Credits — click to edit */}
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 mb-1">Credits</span>
                                    {editingCreditId === sub.id ? (
                                        <input
                                            type="number"
                                            min="0.5" max="10" step="0.5"
                                            value={sub.credit}
                                            autoFocus
                                            onChange={e => handleChange(sub.id, 'credit', e.target.value)}
                                            onBlur={() => setEditingCreditId(null)}
                                            onKeyDown={e => { if (e.key === 'Enter') setEditingCreditId(null); }}
                                            className="w-20 px-2 py-1 border border-gray-900 rounded-lg text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-gray-900"
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setEditingCreditId(sub.id)}
                                            title="Click to edit credit"
                                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold w-fit transition-colors"
                                        >
                                            {sub.credit != null && sub.credit !== "" ? sub.credit : "—"}
                                        </button>
                                    )}
                                </div>

                                {/* Grade (fixed 👇) */}
                                <div className="flex flex-col items-end">
                                    <label className="text-xs text-gray-400 mb-1">Grade</label>
                                    <select
                                        value={sub.grade}
                                        onChange={(e) =>
                                            handleChange(sub.id, "grade", e.target.value)
                                        }
                                        required
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent transition min-w-[110px]"
                                    >
                                        <option value="">Select</option>
                                        {gradeOptions.map((g) => (
                                            <option key={g} value={g}>
                                                {g}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add card */}
                    <button
                        onClick={handleAdd}
                        className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all min-h-[160px]"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="text-xs font-medium">Add Subject</span>
                    </button>
                </div>
            )}

            {/* ── Calculate ── */}
            {hasSubjects && (
                <button
                    onClick={handleCalculate}
                    className="w-full px-6 py-4 bg-gray-900 text-white rounded-xl font-bold text-base hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
                >
                    Calculate TGPA
                </button>
            )}

            {/* ── Result ── */}
            {result && (
                <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl shadow-2xl p-10 text-center">
                    <p className="text-gray-300 text-sm font-medium mb-2">Your Term GPA</p>
                    <p className="text-7xl font-bold text-white mb-4">{result.gpa.toFixed(2)}</p>
                    <p className="text-blue-400 text-xl font-medium">{result.message}</p>
                    <p className="text-gray-400 text-xs mt-3">Out of 10.0</p>
                </div>
            )}

            {/* ── Grade reference ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Grade Points Reference</p>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {[['O', 10], ['A+', 9], ['A', 8], ['B+', 7], ['B', 6], ['C', 5], ['D', 4], ['E/F', 0]].map(([g, p]) => (
                        <div key={g} className="text-center py-2 px-1 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="font-bold text-gray-900 text-xs">{g}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{p} pts</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TPGACalculator;