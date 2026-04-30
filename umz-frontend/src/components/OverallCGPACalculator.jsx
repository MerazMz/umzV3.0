import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const OverallCGPACalculator = ({ semesterData = [], resultData = null }) => {
    // Build grid rows from resultData (preferred) or TermwiseCGPA fallback
    const buildFromData = (data) => {
        // Prefer resultData.semesters — has accurate termId + TGPA
        if (resultData?.semesters?.length > 0) {
            return resultData.semesters.map((sem) => ({
                id: crypto.randomUUID(),
                label: `Term ${sem.termId}`,
                tgpa: sem.tgpa?.toString() || '',
            }));
        }
        // Fallback: TermwiseCGPA
        return data.map((sem) => ({
            id: crypto.randomUUID(),
            label: `Semester ${sem.term}`,
            tgpa: sem.tgpa?.toString() || '',
        }));
    };

    const [semesters, setSemesters] = useState(() => {
        // Try cache first
        try {
            const cached = localStorage.getItem('umz_cgpa_overall_calculator');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed.semesters) && parsed.semesters.length > 0) {
                    return parsed.semesters;
                }
            }
        } catch { /* ignore */ }
        return [];
    });

    const [result, setResult] = useState(null);

    // Seed from resultData (preferred) or semesterData once available (if cache was empty)
    useEffect(() => {
        if (semesters.length === 0) {
            if (resultData?.semesters?.length > 0) {
                setSemesters(buildFromData(semesterData)); // buildFromData checks resultData internally
            } else if (semesterData.length > 0) {
                setSemesters(buildFromData(semesterData));
            }
        }
    }, [semesterData, resultData]);

    // Persist to cache whenever semesters change
    useEffect(() => {
        localStorage.setItem('umz_cgpa_overall_calculator', JSON.stringify({ semesters }));
        setResult(null); // clear stale result on any change
    }, [semesters]);

    /* ─── handlers ─── */
    const handleTGPAChange = (id, value) => {
        setSemesters((prev) =>
            prev.map((s) => (s.id === id ? { ...s, tgpa: value } : s))
        );
    };

    const handleLabelChange = (id, value) => {
        setSemesters((prev) =>
            prev.map((s) => (s.id === id ? { ...s, label: value } : s))
        );
    };

    const handleAdd = () => {
        const nextNum = semesters.length + 1;
        setSemesters((prev) => [
            ...prev,
            { id: crypto.randomUUID(), label: `Semester ${nextNum}`, tgpa: '' },
        ]);
    };

    const handleRemove = (id) => {
        setSemesters((prev) => prev.filter((s) => s.id !== id));
    };

    const handleCalculate = () => {
        if (semesters.length === 0) return;

        for (const sem of semesters) {
            const v = parseFloat(sem.tgpa);
            if (isNaN(v) || v < 0 || v > 10) {
                alert(`Enter a valid TGPA (0–10) for "${sem.label}"`);
                return;
            }
        }

        const sum = semesters.reduce((acc, s) => acc + parseFloat(s.tgpa), 0);
        const cgpa = Math.round((sum / semesters.length) * 100) / 100;
        setResult({ cgpa, numSems: semesters.length });
    };

    const handleReset = () => {
        // Prefer resultData for reset, fallback to semesterData
        const fresh = resultData?.semesters?.length > 0 || semesterData.length > 0
            ? buildFromData(semesterData)
            : [];
        setSemesters(fresh);
        setResult(null);
        localStorage.removeItem('umz_cgpa_overall_calculator');
    };

    const getCGPAMessage = (cgpa) => {
        if (cgpa >= 9.0) return 'Outstanding Academic Record! 🌟';
        if (cgpa >= 8.0) return 'Excellent Performance! 💫';
        if (cgpa >= 7.0) return 'Very Good Work! ⭐';
        if (cgpa >= 6.0) return 'Good Progress! 👍';
        if (cgpa >= 5.0) return 'Keep Working Hard! 💪';
        return 'You Can Improve! 🎯';
    };

    return (
        <div className="space-y-6">
            {/* Info strip + Reset */}
            <div className="flex items-center justify-end gap-3">
                {/* <div className="flex items-center gap-3 flex-1">
                    <span className="text-lg">💡</span>
                    <p className="text-sm text-purple-800">
                        <span className="font-semibold">Formula: </span>
                        CGPA = (TGPA₁ + TGPA₂ + … + TGPAₙ) ÷ n &nbsp;·&nbsp; Edit any TGPA, add or remove semesters, then hit Calculate.
                    </p>
                </div> */}
                <button
                    onClick={handleReset}
                    className="flex-shrink-0 px-4 py-2 text-xs font-semibold text-purple-700 bg-white border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                    ↩ Reset
                </button>
            </div>
        

            {/* Semester cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {semesters.map((sem, index) => (
                    <div
                        key={sem.id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center gap-3 relative hover:shadow-md transition-shadow duration-200"
                    >
                        {/* Remove button */}
                        <button
                            onClick={() => handleRemove(sem.id)}
                            className="absolute top-2.5 right-2.5 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Remove semester"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Badge */}
                        <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {index + 1}
                        </div>

                        {/* Editable label */}
                        <input
                            type="text"
                            value={sem.label}
                            onChange={(e) => handleLabelChange(sem.id, e.target.value)}
                            className="w-full text-xs font-semibold text-gray-500 text-center bg-transparent border-none outline-none focus:bg-gray-50 focus:rounded-md px-1 py-0.5 transition-colors"
                        />

                        {/* TGPA input */}
                        <input
                            type="number"
                            value={sem.tgpa}
                            onChange={(e) => handleTGPAChange(sem.id, e.target.value)}
                            placeholder="TGPA"
                            min="0"
                            max="10"
                            step="0.01"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent text-center font-bold"
                        />
                    </div>
                ))}

                {/* Add semester card */}
                <button
                    onClick={handleAdd}
                    className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200 min-h-[140px]"
                >
                    <Plus className="w-6 h-6" />
                    <span className="text-xs font-medium">Add Semester</span>
                </button>
            </div>

            {/* Calculate button */}
            {semesters.length > 0 && (
                <button
                    onClick={handleCalculate}
                    className="w-full px-6 py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                    Calculate Overall CGPA
                </button>
            )}

            {/* Result */}
            {result && (
                <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl shadow-2xl p-10 text-center">
                    <p className="text-gray-300 text-sm font-medium mb-2">Your Overall CGPA</p>
                    <p className="text-7xl font-bold text-white mb-4">{result.cgpa.toFixed(2)}</p>
                    <p className="text-purple-400 text-xl font-medium mb-2">{getCGPAMessage(result.cgpa)}</p>
                    <p className="text-gray-400 text-xs mt-2">
                        Across {result.numSems} semester{result.numSems !== 1 ? 's' : ''} · Out of 10.0
                    </p>
                </div>
            )}
        </div>
    );
};

export default OverallCGPACalculator;
