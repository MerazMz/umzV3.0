import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Info, AlertTriangle } from 'lucide-react';

const gradePoints = {
    'O': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C+': 5,
    'C': 4,
    'D': 3,
    'E': 0,
    'F': 0
};

const GPAPredictor = () => {
    const [currentCGPA, setCurrentCGPA] = useState(0);
    const [totalCredits, setTotalCredits] = useState(0);
    const [courses, setCourses] = useState([]);
    const [currentTerm, setCurrentTerm] = useState('');
    const [isEditingTerm, setIsEditingTerm] = useState(false);
    const [targetMode, setTargetMode] = useState(false);
    const [targetCGPA, setTargetCGPA] = useState('');
    const [results, setResults] = useState({ tgpa: 0, newCgpa: 0, diff: 0, requiredTgpa: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        // 1. Get current CGPA and past credits from Result data
        const cachedResult = localStorage.getItem('umz_result_data');
        let cgpa = 0;
        let pastCredits = 0;
        let currentSemesterSubjects = [];
        let termId = '';

        if (cachedResult) {
            try {
                const parsed = JSON.parse(cachedResult);
                cgpa = parseFloat(parsed.cgpa) || 0;
                
                // Sort semesters to find the latest one
                const sortedSems = [...(parsed.semesters || [])].sort((a, b) => {
                    // Simple string comparison for term IDs like 123241, 123242
                    return String(b.termId).localeCompare(String(a.termId));
                });

                const latestSem = sortedSems[0];
                if (latestSem) {
                    termId = latestSem.termId;
                    // If subjects in latest semester have no grade, they are ongoing
                    const ongoing = latestSem.subjects.filter(s => !s.grade);
                    if (ongoing.length > 0) {
                        currentSemesterSubjects = ongoing.map(s => ({
                            code: s.code,
                            name: s.name,
                            credits: s.credit || 4,
                            grade: 'A'
                        }));
                    }
                }

                // Calculate total credits from all semesters (excluding ongoing ones)
                (parsed.semesters || []).forEach(sem => {
                    (sem.subjects || []).forEach(sub => {
                        if (sub.credit && sub.grade && sub.grade !== 'F' && sub.grade !== 'E') {
                            pastCredits += parseFloat(sub.credit);
                        }
                    });
                });
            } catch (e) {
                console.error('Error parsing result data:', e);
            }
        }

        // 2. Check cached courses if results didn't have ongoing subjects
        if (currentSemesterSubjects.length === 0) {
            const cachedCourses = localStorage.getItem('umz_student_courses');
            if (cachedCourses) {
                try {
                    const parsed = JSON.parse(cachedCourses);
                    if (parsed.length > 0) {
                        termId = parsed[0].term || termId;
                        currentSemesterSubjects = parsed.map(c => ({
                            code: c.courseCode,
                            name: c.courseName,
                            credits: 4,
                            grade: 'A'
                        }));
                    }
                } catch (e) { console.error(e); }
            }
        }

        // 3. Fallback: Get current courses from Attendance data
        if (currentSemesterSubjects.length === 0) {
            const cachedAttendance = localStorage.getItem('umz_attendance_data');
            if (cachedAttendance) {
                try {
                    const parsed = JSON.parse(cachedAttendance);
                    currentSemesterSubjects = (parsed || []).map(item => ({
                        code: item.courseCode,
                        name: item.courseTitle || '',
                        credits: 4, 
                        grade: 'A'
                    }));
                } catch (e) {
                    console.error('Error parsing attendance data:', e);
                }
            }
        }

        setCurrentCGPA(cgpa);
        setTotalCredits(pastCredits);
        setCourses(currentSemesterSubjects);
        setCurrentTerm(termId);
    };

    useEffect(() => {
        calculateProjected();
    }, [courses, currentCGPA, totalCredits, targetCGPA, targetMode]);

    const calculateProjected = () => {
        if (courses.length === 0) return;

        let semesterGradePoints = 0;
        let semesterCredits = 0;

        courses.forEach(course => {
            const points = gradePoints[course.grade] || 0;
            const credits = parseFloat(course.credits) || 0;
            semesterGradePoints += points * credits;
            semesterCredits += credits;
        });

        const tgpa = semesterCredits > 0 ? semesterGradePoints / semesterCredits : 0;
        const totalPoints = (currentCGPA * totalCredits) + (tgpa * semesterCredits);
        const newTotalCredits = totalCredits + semesterCredits;
        const newCgpa = newTotalCredits > 0 ? totalPoints / newTotalCredits : 0;

        // Calculate Required TGPA for Target Mode
        let requiredTgpa = 0;
        const target = parseFloat(targetCGPA) || 0;
        if (targetMode && target > 0) {
            const requiredTotalPoints = target * newTotalCredits;
            const neededFromThisSem = requiredTotalPoints - (currentCGPA * totalCredits);
            requiredTgpa = neededFromThisSem / semesterCredits;
        }

        setResults({
            tgpa: tgpa.toFixed(2),
            newCgpa: newCgpa.toFixed(2),
            diff: (newCgpa - currentCGPA).toFixed(2),
            semesterCredits,
            requiredTgpa: requiredTgpa.toFixed(2)
        });
    };

    const handleNumericInput = (value, callback) => {
        if (value === '') {
            callback('');
            return;
        }
        const regex = /^\d*\.?\d{0,2}$/;
        if (regex.test(value)) {
            const num = parseFloat(value);
            if (!isNaN(num)) {
                if (num > 10) callback("10");
                else callback(value);
            } else {
                callback(value);
            }
        }
    };

    const findOptimalGrades = () => {
        const reqTgpa = parseFloat(results.requiredTgpa);
        if (reqTgpa > 10) return "Impossible (Requires TGPA > 10)";
        if (reqTgpa <= 0) return "Already achieved!";

        // Suggest a balanced grade spread
        const grades = Object.keys(gradePoints).filter(g => g === g.toUpperCase()).sort((a,b) => gradePoints[b] - gradePoints[a]);
        let suggestedGrade = 'A';
        for (let g of grades) {
            if (gradePoints[g] >= reqTgpa) {
                suggestedGrade = g;
            }
        }
        return `Maintain at least '${suggestedGrade}' in all subjects.`;
    };

    const updateCourse = (index, field, value) => {
        const newCourses = [...courses];
        newCourses[index][field] = value;
        setCourses(newCourses);
    };

    return (
        <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit mx-auto shadow-inner">
                <button 
                    onClick={() => setTargetMode(false)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!targetMode ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Predict Mode
                </button>
                <button 
                    onClick={() => setTargetMode(true)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${targetMode ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Target Mode 🏆
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Current CGPA</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{currentCGPA || '0.00'}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Based on {totalCredits} earned credits</p>
                </div>

                {!targetMode ? (
                    <div className="bg-gray-900 dark:bg-white rounded-2xl p-5 shadow-xl md:scale-105 z-10 transition-all">
                        <p className="text-xs text-white/70 dark:text-gray-500 uppercase font-bold tracking-wider mb-1">Projected CGPA</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-black text-white dark:text-gray-900">{results.newCgpa}</p>
                            <span className={`text-sm font-bold ${parseFloat(results.diff) >= 0 ? 'text-green-400 dark:text-green-600' : 'text-red-400 dark:text-red-600'}`}>
                                {parseFloat(results.diff) >= 0 ? '+' : ''}{results.diff}
                            </span>
                        </div>
                        <p className="text-[10px] text-white/50 dark:text-gray-400 mt-1">Expected after this semester</p>
                    </div>
                ) : (
                    <div className="bg-blue-600 rounded-2xl p-5 shadow-xl md:scale-105 z-10 transition-all border-2 border-blue-400">
                        <p className="text-xs text-white/70 uppercase font-bold tracking-wider mb-1">Target CGPA</p>
                        <div className="flex items-center gap-3">
                            <input 
                                type="text" 
                                inputMode="decimal"
                                placeholder="0.00"
                                value={targetCGPA}
                                onChange={(e) => handleNumericInput(e.target.value, setTargetCGPA)}
                                className="bg-transparent text-4xl font-black text-white w-24 outline-none border-b-2 border-white/30 focus:border-white transition-all placeholder:text-white/30"
                            />
                            <TrendingUp className="h-6 w-6 text-blue-200 animate-pulse" />
                        </div>
                        <p className="text-[10px] text-white/50 mt-1">Goal for this semester</p>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">{targetMode ? 'Required TGPA' : 'Projected TGPA'}</p>
                    <p className={`text-3xl font-black ${targetMode && results.requiredTgpa > 10 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                        {targetMode ? results.requiredTgpa : results.tgpa}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">For {results.semesterCredits} current credits</p>
                </div>
            </div>

            {targetMode && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                        <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Smart Strategy</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            {results.requiredTgpa > 10 
                                ? "Impossible to hit this target in one semester. Try a lower goal." 
                                : `To hit ${targetCGPA}, you need a TGPA of ${results.requiredTgpa}. ${findOptimalGrades()}`
                            }
                        </p>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-gray-900 dark:text-white" />
                        <h3 className="font-bold text-gray-900 dark:text-white">Predictor Calculator</h3>
                        <div className="flex items-center">
                            {isEditingTerm ? (
                                <input
                                    autoFocus
                                    type="text"
                                    value={currentTerm}
                                    onChange={(e) => setCurrentTerm(e.target.value)}
                                    onBlur={() => setIsEditingTerm(false)}
                                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingTerm(false)}
                                    className="ml-2 w-20 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            ) : (
                                <button 
                                    onClick={() => setIsEditingTerm(true)}
                                    className="ml-2 text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full hover:bg-blue-200 transition-colors"
                                    title="Click to edit Term ID"
                                >
                                    Term {currentTerm || '????'}
                                </button>
                            )}
                        </div>
                    </div>
                    {!targetMode && (
                        <div className="flex items-center gap-2 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                            <Info className="h-3 w-3" />
                            <span>Adjust credits and grades to see impact</span>
                        </div>
                    )}
                </div>

                {!targetMode ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold">
                                <tr>
                                    <th className="px-6 py-3 text-left">Course</th>
                                    <th className="px-6 py-3 text-center w-24">Credits</th>
                                    <th className="px-6 py-3 text-center w-32">Target Grade</th>
                                    <th className="px-6 py-3 text-center w-24">Points</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {courses.map((course, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 dark:text-white">{course.code}</div>
                                            <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{course.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                value={course.credits}
                                                onChange={(e) => updateCourse(idx, 'credits', e.target.value)}
                                                className="w-16 mx-auto block text-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-1 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white outline-none"
                                                step="0.5"
                                                min="0"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={course.grade}
                                                onChange={(e) => updateCourse(idx, 'grade', e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-1 px-2 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white outline-none appearance-none cursor-pointer"
                                            >
                                                {Object.keys(gradePoints).filter(g => g === g.toUpperCase()).map(g => (
                                                    <option key={g} value={g}>{g}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full font-black text-gray-900 dark:text-white">
                                                {gradePoints[course.grade]}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center bg-gray-50 dark:bg-gray-900/50">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Target Mode Active</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Enter your goal in the blue card above. We've calculated exactly what TGPA you need to hit to reach your dream CGPA.
                            </p>
                            <button 
                                onClick={() => setTargetMode(false)}
                                className="mt-6 px-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                ← Switch back to manual prediction
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Legend / Tips */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-4 flex gap-3">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed">
                    <strong>Pro Tip:</strong> Credits for ongoing courses are pulled from your attendance data. You can edit them in the table if they are incorrect (e.g., if a lab is 1.0 credit). The calculator uses the standard LPU 10-point scale (O=10, A+=9, etc.).
                </p>
            </div>
        </div>
    );
};

export default GPAPredictor;
