import React, { useState, useEffect } from 'react';

const TPGACalculator = ({ semesterData = [] }) => {
    const [numSubjects, setNumSubjects] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [result, setResult] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState('');

    // Grade points mapping
    const gradePoints = {
        "O": 10, "o": 10,
        "A+": 9, "a+": 9,
        "A": 8, "a": 8,
        "B+": 7, "b+": 7,
        "B": 6, "b": 6,
        "C": 5, "c": 5,
        "D": 4, "d": 4,
        "E": 0, "e": 0,
        "F": 0, "f": 0
    };

    // Extract credits from course name (assuming format like "COURSE NAME::3.0" or just get from subject data)
    const extractCredits = (courseName) => {
        // Try to extract from course name if it has credits
        const match = courseName.match(/(\d+\.?\d*)\s*credits?/i);
        if (match) return match[1];
        // Default credits - you might want to adjust this
        return '3';
    };

    // Load cached data on mount
    useEffect(() => {
        const cachedData = localStorage.getItem('umz_tgpa_calculator');
        if (cachedData) {
            try {
                const parsed = JSON.parse(cachedData);
                if (parsed.numSubjects) {
                    setNumSubjects(parsed.numSubjects);
                    setSubjects(parsed.subjects || []);
                    setShowForm(true);
                    setSelectedSemester(parsed.selectedSemester || '');
                    if (parsed.result) {
                        setResult(parsed.result);
                    }
                }
            } catch (err) {
                console.error('Error loading cached calculator data:', err);
            }
        }
    }, []);

    // Cache data whenever it changes
    useEffect(() => {
        if (numSubjects || subjects.length > 0) {
            localStorage.setItem('umz_tgpa_calculator', JSON.stringify({
                numSubjects,
                subjects,
                result,
                selectedSemester
            }));
        }
    }, [numSubjects, subjects, result, selectedSemester]);

    const handleSemesterSelect = (e) => {
        const semesterTerm = e.target.value;
        setSelectedSemester(semesterTerm);

        if (!semesterTerm) return;

        const semester = semesterData.find(s => s.term === semesterTerm);
        if (semester && semester.subjects && semester.subjects.length > 0) {
            const semesterSubjects = semester.subjects.map(subject => {
                const [code, courseName] = subject.course.split('::');
                const credits = subject.credit || extractCredits(courseName || '') || '3.0';
                return {
                    grade: subject.grade || '',
                    credit: credits.toString(),
                    courseName: courseName?.trim() || code?.trim() || 'Subject'
                };
            });

            setNumSubjects(semesterSubjects.length.toString());
            setSubjects(semesterSubjects);
            setShowForm(true);
            setResult(null);
        }
    };

    const handleGenerateFields = () => {
        const num = parseInt(numSubjects);
        if (!num || num < 1 || num > 20) {
            alert('Please enter a valid number of subjects (1-20).');
            return;
        }

        // Create empty subject array
        const newSubjects = Array.from({ length: num }, () => ({
            grade: '',
            credit: '',
            courseName: ''
        }));

        setSubjects(newSubjects);
        setShowForm(true);
        setResult(null);
        setSelectedSemester('');
    };

    const handleInputChange = (index, field, value) => {
        const updated = [...subjects];
        updated[index][field] = value;
        setSubjects(updated);
        setResult(null); // Clear result when inputs change
    };

    const handleCalculate = (e) => {
        e.preventDefault();

        let totalPoints = 0;
        let totalCredits = 0;

        for (let i = 0; i < subjects.length; i++) {
            const grade = subjects[i].grade.trim().toUpperCase();
            const credit = parseFloat(subjects[i].credit);

            if (!grade || isNaN(credit)) {
                alert(`Please fill all fields for Subject ${i + 1}`);
                return;
            }

            if (!gradePoints.hasOwnProperty(grade)) {
                alert(`Invalid grade '${grade}' provided for Subject ${i + 1}`);
                return;
            }

            totalPoints += gradePoints[grade] * credit;
            totalCredits += credit;
        }

        if (totalCredits === 0) {
            alert('Total credits cannot be zero');
            return;
        }

        const gpa = totalPoints / totalCredits;
        const roundedGpa = Math.round(gpa * 100) / 100;

        const calculatedResult = {
            gpa: roundedGpa,
            message: getGPAMessage(roundedGpa)
        };

        setResult(calculatedResult);
    };

    const getGPAMessage = (gpa) => {
        if (gpa >= 9.0) return "Outstanding Performance! 🌟";
        if (gpa >= 8.0) return "Excellent Work! 💫";
        if (gpa >= 7.0) return "Very Good Achievement! ⭐";
        if (gpa >= 6.0) return "Good Progress! 👍";
        if (gpa >= 5.0) return "Keep Working Hard! 💪";
        return "You Can Improve! 🎯";
    };

    const handleReset = () => {
        setNumSubjects('');
        setSubjects([]);
        setShowForm(false);
        setResult(null);
        setSelectedSemester('');
        localStorage.removeItem('umz_tgpa_calculator');
    };

    return (
        <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 How to use</h4>
                <ul className="text-sm text-blue-800 space-y-1.5 list-disc list-inside">
                    <li>Select a semester to auto-fill grades and credits, or manually enter the number of subjects</li>
                    <li>Fill in the grade (O, A+, A, B+, B, C, D, E/F) for each subject</li>
                    <li>Enter the credit hours for each subject</li>
                    <li>Click Calculate to see your Term GPA (TGPA)</li>
                </ul>
            </div>

            {/* Number of Subjects Input or Semester Selector */}
            {!showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Calculate Your Term GPA</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Manual Entry */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Manual Entry
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={numSubjects}
                                    onChange={(e) => setNumSubjects(e.target.value)}
                                    placeholder="Number of subjects (1-20)"
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                />
                                <button
                                    onClick={handleGenerateFields}
                                    className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                    Generate
                                </button>
                            </div>
                        </div>

                        {/* Semester Selector */}
                        {semesterData.length > 0 && (
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Or Select Semester
                                </label>
                                <select
                                    value={selectedSemester}
                                    onChange={handleSemesterSelect}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white appearance-none cursor-pointer"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                        backgroundPosition: 'right 0.5rem center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: '1.5em 1.5em',
                                        paddingRight: '2.5rem'
                                    }}
                                >
                                    <option value="">Choose a semester...</option>
                                    {semesterData.map((semester) => (
                                        <option key={semester.term} value={semester.term}>
                                            Semester {semester.term} - TGPA: {semester.tgpa}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Subject Input Form */}
            {showForm && (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">
                                Enter Grades & Credits
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {subjects.length} Subject{subjects.length !== 1 ? 's' : ''}
                                {selectedSemester && ` • Semester ${selectedSemester}`}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Start Over
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleCalculate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {subjects.map((subject, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900 text-sm">Subject {index + 1}</div>
                                                {subject.courseName && (
                                                    <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">
                                                        {subject.courseName}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-2">
                                                Grade
                                            </label>
                                            <select
                                                value={subject.grade}
                                                onChange={(e) => handleInputChange(index, 'grade', e.target.value)}
                                                required
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-gray-900 focus:border-transparent text-center bg-white appearance-none cursor-pointer"
                                                style={{
                                                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                                    backgroundPosition: 'right 0.5rem center',
                                                    backgroundRepeat: 'no-repeat',
                                                    backgroundSize: '1.5em 1.5em',
                                                    paddingRight: '2.5rem'
                                                }}
                                            >
                                                <option value="">Select</option>
                                                <option value="O">O </option>
                                                <option value="A+">A+</option>
                                                <option value="A">A </option>
                                                <option value="B+">B+ </option>
                                                <option value="B">B </option>
                                                <option value="C">C </option>
                                                <option value="D">D </option>
                                                <option value="E">E </option>
                                                <option value="F">F </option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-2">
                                                Credits
                                            </label>
                                            <input
                                                type="number"
                                                value={subject.credit}
                                                onChange={(e) => handleInputChange(index, 'credit', e.target.value)}
                                                placeholder="3"
                                                required
                                                min="1"
                                                max="10"
                                                step="1"
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent text-center"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type="submit"
                            className="w-full px-6 py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            Calculate TGPA
                        </button>
                    </form>
                </div>
            )}

            {/* Result Display */}
            {result && (
                <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl shadow-2xl p-10 text-center">
                    <p className="text-gray-300 text-sm font-medium mb-2">Your Term GPA</p>
                    <p className="text-7xl font-bold text-white mb-4">
                        {result.gpa.toFixed(2)}
                    </p>
                    <p className="text-blue-400 text-xl font-medium mb-2">
                        {result.message}
                    </p>
                    <p className="text-gray-400 text-xs mt-4">Out of 10.0</p>
                </div>
            )}

            {/* Grade Reference */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Grade Points Reference</h3>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    {Object.entries({
                        "O": 10,
                        "A+": 9,
                        "A": 8,
                        "B+": 7,
                        "B": 6,
                        "C": 5,
                        "D": 4,
                        "E/F": 0
                    }).map(([grade, points]) => (
                        <div key={grade} className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="font-bold text-gray-900 text-sm">{grade}</div>
                            <div className="text-xs text-gray-500 mt-1">{points} pts</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TPGACalculator;