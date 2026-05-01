import React, { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, Target, Calculator, Info } from 'lucide-react';

const OverallCGPACalculator = ({ semesterData = [], resultData = null }) => {
    // Build grid rows from resultData (preferred) or TermwiseCGPA fallback
    const buildFromData = (data) => {
        if (resultData?.semesters?.length > 0) {
            return resultData.semesters.map((sem) => ({
                id: crypto.randomUUID(),
                label: `Term ${sem.termId}`,
                tgpa: sem.tgpa?.toString() || '',
            }));
        }
        return data.map((sem) => ({
            id: crypto.randomUUID(),
            label: `Semester ${sem.term}`,
            tgpa: sem.tgpa?.toString() || '',
        }));
    };

    const [semesters, setSemesters] = useState(() => {
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
    const [targetMode, setTargetMode] = useState(false);
    const [targetCGPA, setTargetCGPA] = useState('');
    const [requiredTgpa, setRequiredTgpa] = useState('0.00');

    useEffect(() => {
        if (semesters.length === 0) {
            if (resultData?.semesters?.length > 0 || semesterData.length > 0) {
                setSemesters(buildFromData(semesterData));
            }
        }
    }, [semesterData, resultData]);

    useEffect(() => {
        localStorage.setItem('umz_cgpa_overall_calculator', JSON.stringify({ semesters }));
        setResult(null);
    }, [semesters]);

    useEffect(() => {
        if (targetMode) calculateTarget();
    }, [semesters, targetCGPA, targetMode]);

    const calculateTarget = () => {
        if (semesters.length === 0) return;
        
        // Sum of all TGPAs that are already entered
        const enteredSems = semesters.filter(s => s.tgpa && !isNaN(parseFloat(s.tgpa)));
        const sum = enteredSems.reduce((acc, s) => acc + parseFloat(s.tgpa), 0);
        
        // Total semesters = entered + the one we want to predict
        const totalSems = enteredSems.length + 1;
        const target = parseFloat(targetCGPA) || 0;
        let req = (target * totalSems) - sum;
        if (req < 0) req = 0;
        setRequiredTgpa(req.toFixed(2));
    };

    const handleNumericInput = (value, callback) => {
        // Allow empty
        if (value === '') {
            callback('');
            return;
        }

        // Regex for up to 2 decimal places
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

    const handleTGPAChange = (id, value) => {
        handleNumericInput(value, (val) => {
            setSemesters((prev) => prev.map((s) => (s.id === id ? { ...s, tgpa: val } : s)));
        });
    };

    const handleLabelChange = (id, value) => {
        setSemesters((prev) => prev.map((s) => (s.id === id ? { ...s, label: value } : s)));
    };

    const handleAdd = () => {
        const nextNum = semesters.length + 1;
        setSemesters((prev) => [...prev, { id: crypto.randomUUID(), label: `Semester ${nextNum}`, tgpa: '' }]);
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl w-fit mx-auto shadow-inner">
                <button 
                    onClick={() => setTargetMode(false)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${!targetMode ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Calculator className="w-4 h-4" />
                    Calculator
                </button>
                <button 
                    onClick={() => {
                        setTargetMode(true);
                        if (targetCGPA === '' && resultData?.cgpa) setTargetCGPA((parseFloat(resultData.cgpa) + 0.1).toFixed(2));
                    }}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${targetMode ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Target className="w-4 h-4 text-gray-900 dark:text-white" />
                    Target Finder 🏆
                </button>
            </div>

            {/* Target Display Area */}
            {targetMode && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    <div className="bg-gray-900 dark:bg-gray-800 rounded-[32px] p-8 text-white shadow-xl flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-3">Goal CGPA</p>
                        <div className="flex items-center gap-4">
                            <input 
                                type="text" 
                                inputMode="decimal"
                                placeholder="0.00"
                                value={targetCGPA}
                                onChange={(e) => handleNumericInput(e.target.value, setTargetCGPA)}
                                className="bg-transparent text-6xl font-black outline-none border-b-4 border-white/20 focus:border-white transition-all w-36 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-white/20"
                            />
                            <TrendingUp className="w-10 h-10 text-gray-600 animate-pulse" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 border-4 border-gray-100 dark:border-gray-800 rounded-[32px] p-8 shadow-sm flex flex-col justify-center text-center">
                        <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-3">Required TGPA</p>
                        <p className={`text-6xl font-black tabular-nums ${requiredTgpa > 10 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                            {requiredTgpa}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-wider">
                            {requiredTgpa > 10 ? "⚠️ Target unreachable this term" : "Needed in your next semester"}
                        </p>
                    </div>
                </div>
            )}

            {/* Info strip */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full">
                    <Info className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        {targetMode ? "Calculate target based on past scores" : "Simple Average (Sum ÷ Count)"}
                    </p>
                </div>
                <button
                    onClick={handleReset}
                    className="px-4 py-1.5 text-[10px] font-black text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1"
                >
                    ↩ Reset
                </button>
            </div>

            {/* Semester cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {semesters.map((sem, index) => (
                    <div
                        key={sem.id}
                        className="bg-white dark:bg-gray-800 rounded-[28px] shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center gap-4 relative group hover:shadow-xl transition-all duration-300"
                    >
                        <button
                            onClick={() => handleRemove(sem.id)}
                            className="absolute top-3 right-3 p-1.5 rounded-xl text-gray-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-center text-sm font-black shadow-inner">
                            {index + 1}
                        </div>

                        <input
                            type="text"
                            value={sem.label}
                            onChange={(e) => handleLabelChange(sem.id, e.target.value)}
                            className="w-full text-[10px] font-black text-gray-400 text-center uppercase tracking-widest bg-transparent border-none outline-none"
                        />

                        <div className="relative w-full">
                            <input
                                type="text"
                                inputMode="decimal"
                                value={sem.tgpa}
                                onChange={(e) => handleTGPAChange(sem.id, e.target.value)}
                                placeholder="0.00"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-gray-900 dark:focus:border-white rounded-2xl text-xl focus:outline-none text-center font-black text-gray-900 dark:text-white transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-300 dark:placeholder:text-gray-700"
                            />
                            {sem.tgpa && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-900 dark:bg-white rounded-full" />
                            )}
                        </div>
                    </div>
                ))}

                <button
                    onClick={handleAdd}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-[28px] border-2 border-dashed border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center gap-2 text-gray-300 hover:border-gray-900 dark:hover:border-white hover:text-gray-900 dark:hover:text-white transition-all duration-300 min-h-[160px]"
                >
                    <Plus className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Add Sem</span>
                </button>
            </div>

            {/* Calculate / Result */}
            {!targetMode ? (
                <div className="space-y-6">
                    {semesters.length > 0 && (
                        <button
                            onClick={handleCalculate}
                            className="w-full px-8 py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-3xl font-black text-xl hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl flex items-center justify-center gap-3"
                        >
                            <Calculator className="w-6 h-6" />
                            Generate Result
                        </button>
                    )}

                    {result && (
                        <div className="bg-gray-900 dark:bg-white rounded-[40px] shadow-2xl p-12 text-center animate-in zoom-in duration-500">
                            <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em] mb-4">Academic Summary</p>
                            <div className="relative inline-block">
                                <p className="text-8xl font-black text-white dark:text-gray-900 mb-4 tabular-nums">{result.cgpa.toFixed(2)}</p>
                                <div className="absolute -top-4 -right-4 w-8 h-8 bg-gray-800 dark:bg-gray-200 rounded-full flex items-center justify-center text-white dark:text-gray-900 text-[10px]">🏆</div>
                            </div>
                            <p className="text-white dark:text-gray-900 text-3xl font-black mb-4">
                                {getCGPAMessage(result.cgpa)}
                            </p>
                            <div className="h-0.5 w-24 bg-gray-800 dark:bg-gray-200 mx-auto mb-6" />
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                                Computed from {result.numSems} semester{result.numSems !== 1 ? 's' : ''}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[32px] p-6 flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center shrink-0 shadow-sm">
                        <TrendingUp className="w-5 h-5 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">Strategy Engine</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed mt-1 font-bold">
                            Target Finder analyzes your past {semesters.filter(s => s.tgpa).length} semesters to project the required performance for your upcoming term. Ensure all past TGPAs are accurate for the best strategy.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OverallCGPACalculator;
