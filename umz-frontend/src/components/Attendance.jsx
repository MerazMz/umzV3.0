import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, X, Calculator, BarChart2 } from 'lucide-react';
import Sidebar from './Sidebar';
import { getAttendanceDetails } from '../services/api';
import AttendanceCalculator from './AttendanceCalculator';

const Attendance = () => {
    const navigate = useNavigate();

    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState('subject');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(() => {
        const cachedTab = localStorage.getItem('umz_attendance_active_tab');
        return cachedTab || 'view';
    });

    useEffect(() => {
        const fetchAttendance = async () => {
            const cachedData = localStorage.getItem('umz_attendance_data');
            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    const seenCodes = new Set();
                    const uniqueParsed = (parsed || []).filter(item => {
                        if (seenCodes.has(item.courseCode)) return false;
                        seenCodes.add(item.courseCode);
                        return true;
                    });
                    setAttendanceData(uniqueParsed || []);
                    setLoading(false);
                    return;
                } catch {
                    localStorage.removeItem('umz_attendance_data');
                }
            }

            const cookies = localStorage.getItem('umz_cookies');
            if (!cookies) {
                setLoading(false);
                setError('');
                setAttendanceData([]);
                return;
            }

            try {
                setLoading(true);
                const result = await getAttendanceDetails(cookies);
                const rawData = result.data || [];
                const seenFetched = new Set();
                const uniqueData = rawData.filter(item => {
                    if (seenFetched.has(item.courseCode)) return false;
                    seenFetched.add(item.courseCode);
                    return true;
                });
                setAttendanceData(uniqueData);
                localStorage.setItem('umz_attendance_data', JSON.stringify(uniqueData));
                setError('');
            } catch (err) {
                setError(err.message || 'Failed to load attendance');
                if (err.message?.includes('session') || err.message?.includes('unauthorized')) {
                    localStorage.removeItem('umz_cookies');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [navigate]);

    useEffect(() => {
        localStorage.setItem('umz_attendance_active_tab', activeTab);
    }, [activeTab]);

    // Use UMS-official percent from summary when available; fall back to calculated.
    const getPercentage = (item) => {
        if (item.summaryPercent != null) {
            const val = parseFloat(String(item.summaryPercent).replace('%', ''));
            if (!isNaN(val)) return val;
        }
        return item.totalRecords > 0
            ? (item.presentCount / item.totalRecords) * 100
            : 0;
    };

    // Returns { label, statusClass, barColor, textColor }
    const getStatus = (pct) => {
        if (pct >= 75) return { label: 'On Track', dot: 'bg-emerald-500', bar: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        if (pct >= 65) return { label: 'At Risk', dot: 'bg-amber-500', bar: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
        return { label: 'Short', dot: 'bg-red-500', bar: 'bg-red-500', text: 'text-red-700', badge: 'bg-red-50 text-red-700 border-red-200' };
    };

    // ── RPL badge logic ───────────────────────────────────────────────────
    // Grades considered "B+ or above"
    const rplGoodGrades = new Set(['O', 'A+', 'A', 'B+']);

    // Build a map: courseCode (uppercase) -> grade, from cached result data
    const rplSubjectMap = (() => {
        try {
            const cached = localStorage.getItem('umz_result_data');
            if (!cached) return {};
            const parsed = JSON.parse(cached);
            const map = {};
            (parsed.rplGrades || []).forEach(grp => {
                (grp.subjects || []).forEach(sub => {
                    if (sub.code && sub.grade && rplGoodGrades.has(sub.grade.trim().toUpperCase())) {
                        map[sub.code.trim().toUpperCase()] = sub.grade.trim();
                    }
                });
            });
            return map;
        } catch { return {}; }
    })();

    const sortedData = [...attendanceData].sort((a, b) => {
        switch (sortBy) {
            case 'percentage': return getPercentage(b) - getPercentage(a);
            case 'lectures': return (b.totalRecords || 0) - (a.totalRecords || 0);
            default: return (a.courseCode || '').localeCompare(b.courseCode || '');
        }
    });

    const filteredData = sortedData.filter((item) => {
        if (filterStatus === 'all') return true;
        const p = getPercentage(item);
        if (filterStatus === 'good') return p >= 75;
        if (filterStatus === 'warning') return p >= 65 && p < 75;
        if (filterStatus === 'critical') return p < 65;
        return true;
    });

    const overallAttendance = () => {
        try {
            const data = JSON.parse(localStorage.getItem('umz_student_info'));
            return data?.AggAttendance || null;
        } catch {
            return null;
        }
    };

    const counts = {
        good: attendanceData.filter(i => getPercentage(i) >= 75).length,
        warning: attendanceData.filter(i => getPercentage(i) >= 65 && getPercentage(i) < 75).length,
        critical: attendanceData.filter(i => getPercentage(i) < 65).length,
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-gray-800 dark:border-white border-r-transparent" />
                        <p className="mt-3 text-sm text-gray-400">Loading attendance…</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar />
                <main className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Error</p>
                            <p className="text-sm text-gray-500">{error}</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8 space-y-6">

                    {/* ── Header ── */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Attendance</h1>
                            <p className="text-sm text-gray-500 mt-0.5">{attendanceData.length} subject{attendanceData.length !== 1 ? 's' : ''} tracked</p>
                        </div>

                        {/* Overall stat pill */}
                        <div className="shrink-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3 text-center shadow-sm">
                            <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wider font-medium">Overall</p>
                            <p className={`text-2xl font-bold ${Number(overallAttendance()) >= 75 ? 'text-emerald-600' : Number(overallAttendance()) >= 65 ? 'text-amber-600' : 'text-red-600'}`}>
                                {overallAttendance()}%
                            </p>
                        </div>
                    </div>

                    {/* ── Summary stats row ── */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'On Track', count: counts.good, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
                            { label: 'At Risk', count: counts.warning, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
                            { label: 'Short', count: counts.critical, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
                        ].map(({ label, count, color, bg, border }) => (
                            <div key={label} className={`rounded-xl border ${border} ${bg} p-4 text-center`}>
                                <p className={`text-xl font-bold ${color}`}>{count}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Tab bar ── */}
                    <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 gap-1">
                        {[
                            { key: 'view', label: 'Attendance', Icon: BarChart2 },
                            { key: 'calculator', label: 'Calculator', Icon: Calculator },
                        ].map(({ key, label, Icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all
                                    ${activeTab === key
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* ── Tab content ── */}
                    {activeTab === 'view' ? (
                        <>
                            {/* Filter / sort bar */}
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Sort</span>
                                {['subject', 'percentage', 'lectures'].map(key => (
                                    <button
                                        key={key}
                                        onClick={() => setSortBy(key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                                            ${sortBy === key
                                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                                            }`}
                                    >
                                        {key === 'subject' ? 'Subject' : key === 'percentage' ? '% High→Low' : 'Most Classes'}
                                    </button>
                                ))}

                                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Filter</span>
                                {[
                                    { key: 'all', label: `All (${attendanceData.length})` },
                                    { key: 'good', label: `On Track (${counts.good})` },
                                    { key: 'warning', label: `At Risk (${counts.warning})` },
                                    { key: 'critical', label: `Short (${counts.critical})` },
                                ].map(({ key, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => setFilterStatus(key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                                            ${filterStatus === key
                                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Course cards */}
                            {filteredData.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
                                    <p className="text-sm text-gray-400">No subjects match the selected filter.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {filteredData.map((item, index) => {
                                        const pct = getPercentage(item);
                                        const status = getStatus(pct);
                                        const present = item.presentCount || 0;
                                        const absent = item.absentCount || 0;
                                        const total = item.totalRecords || 0;
                                        const dutyLeave = item.od != null ? item.od : null;
                                        const lastDate = item.lastDate || null;
                                        const faculty = item.records?.length > 0 ? item.records[0].faculty : '';
                                        const title = item.courseTitle || '';

                                        return (
                                            <div
                                                key={index}
                                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow duration-200"
                                            >
                                                {/* Card header */}
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="min-w-0 flex-1 pr-3">
                                                        <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{item.courseCode || 'N/A'}</h3>
                                                        {title && (
                                                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{title}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {/* RPL badge */}
                                                        {rplSubjectMap[(item.courseCode || '').trim().toUpperCase()] && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 rounded-full text-[10px] font-bold tracking-wide">
                                                                🏅 RPL · {rplSubjectMap[(item.courseCode || '').trim().toUpperCase()]}
                                                            </span>
                                                        )}
                                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status.badge}`}>
                                                            {status.label}
                                                        </span>

                                                        <button
                                                            onClick={() => { setSelectedCourse(item); setIsModalOpen(true); }}
                                                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                                            title="View all records"
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Percentage + progress bar */}
                                                <div className="mb-4">
                                                    <div className="flex items-baseline justify-between mb-1.5">
                                                        <span className={`text-2xl font-bold ${status.text}`}>{pct.toFixed(2)}%</span>
                                                        <span className="text-xs text-gray-400">{present}/{total} classes</span>
                                                    </div>
                                                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${status.bar}`}
                                                            style={{ width: `${Math.min(pct, 100)}%` }}
                                                        />
                                                    </div>
                                                    {/* 75% marker */}
                                                    <div className="relative h-0 -mt-1.5">
                                                        <div className="absolute" style={{ left: '75%', transform: 'translateX(-50%)' }}>
                                                            <div className="w-px h-2.5 bg-gray-300 dark:bg-gray-600" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stats row */}
                                                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                    <div className="text-center">
                                                        <p className="text-xs text-gray-400 mb-0.5">Present</p>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{present}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs text-gray-400 mb-0.5">Absent</p>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{absent}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs text-gray-400 mb-0.5">Total</p>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{total}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs text-gray-400 mb-0.5">Duty Leave</p>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            {dutyLeave != null && dutyLeave !== '' && dutyLeave !== '0' ? dutyLeave : '—'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Footer meta */}
                                                {(faculty || lastDate) && (
                                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                        {faculty && <p className="text-xs text-gray-400 truncate">{faculty}</p>}
                                                        {lastDate && <p className="text-xs text-gray-400 shrink-0 ml-2">Last: {lastDate}</p>}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Legend */}
                            <div className="flex items-center gap-6 px-1">
                                {[
                                    { label: 'On Track ≥ 75%', dot: 'bg-emerald-500' },
                                    { label: 'At Risk 65–74%', dot: 'bg-amber-500' },
                                    { label: 'Short < 65%', dot: 'bg-red-500' },
                                ].map(({ label, dot }) => (
                                    <div key={label} className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${dot}`} />
                                        <span className="text-xs text-gray-500">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <AttendanceCalculator />
                    )}
                </div>
            </main>

            {/* ── Detail modal ── */}
            {isModalOpen && selectedCourse && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => { setIsModalOpen(false); setSelectedCourse(null); }}
                >
                    <div
                        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedCourse.courseCode}</h2>
                                {selectedCourse.courseTitle && (
                                    <p className="text-xs text-gray-400 mt-0.5">{selectedCourse.courseTitle}</p>
                                )}
                            </div>
                            <button
                                onClick={() => { setIsModalOpen(false); setSelectedCourse(null); }}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal summary strip */}
                        <div className="grid grid-cols-4 divide-x divide-gray-100 dark:divide-gray-800 border-b border-gray-100 dark:border-gray-800">
                            {[
                                { label: 'Present', value: selectedCourse.presentCount || 0 },
                                { label: 'Absent', value: selectedCourse.absentCount || 0 },
                                { label: 'Total', value: selectedCourse.totalRecords || 0 },
                                { label: 'Duty Leave', value: selectedCourse.od != null && selectedCourse.od !== '' ? selectedCourse.od : '—' },
                            ].map(({ label, value }) => (
                                <div key={label} className="py-3 text-center">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Record list */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
                            {selectedCourse.records?.length > 0 ? (
                                selectedCourse.records.map((r, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm
                                            ${r.status === 'P'
                                                ? 'bg-gray-50 dark:bg-gray-800/60 border-gray-100 dark:border-gray-700/60'
                                                : 'bg-red-50/60 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.status === 'P' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{r.date}</p>
                                                <p className="text-xs text-gray-400">{r.time}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-right">
                                            <p className="text-xs text-gray-400 hidden sm:block truncate max-w-[140px]">{r.faculty}</p>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md
                                                ${r.status === 'P'
                                                    ? 'text-emerald-700 dark:text-emerald-400'
                                                    : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                {r.status === 'P' ? 'Present' : 'Absent'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-400 text-center py-8">No records available.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Attendance;