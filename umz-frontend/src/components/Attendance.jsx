import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, X } from 'lucide-react';
import Sidebar from './Sidebar';
import { getAttendanceDetails } from '../services/api';

const Attendance = () => {
    const navigate = useNavigate();

    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState('subject');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchAttendance = async () => {
            // First, always check for cached data
            const cachedData = localStorage.getItem('umz_attendance_data');
            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    setAttendanceData(parsed);
                    setLoading(false);
                    return; // Use cache, don't fetch
                } catch {
                    localStorage.removeItem('umz_attendance_data');
                }
            }

            // No cache available - check if we have cookies
            const cookies = localStorage.getItem('umz_cookies');

            if (!cookies) {
                // No cookies and no cache - show empty state
                console.log('⚠️ No cookies and no cached attendance');
                setLoading(false);
                setError('');
                setAttendanceData([]);
                return;
            }

            // We have cookies but no cache - fetch fresh data
            try {
                setLoading(true);
                const result = await getAttendanceDetails(cookies);
                setAttendanceData(result.data || []);
                localStorage.setItem(
                    'umz_attendance_data',
                    JSON.stringify(result.data || [])
                );
                setError('');
            } catch (err) {
                setError(err.message || 'Failed to load attendance');
                if (
                    err.message?.includes('session') ||
                    err.message?.includes('unauthorized')
                ) {
                    // Session expired - remove cookies
                    localStorage.removeItem('umz_cookies');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [navigate]);

    const getAttendanceStatus = (percentage) => {
        if (percentage >= 75)
            return {
                label: 'Good',
                color: 'bg-green-100 text-green-800',
                border: 'border-green-200',
            };
        if (percentage >= 65)
            return {
                label: 'Warning',
                color: 'bg-yellow-100 text-yellow-800',
                border: 'border-yellow-200',
            };
        return {
            label: 'Critical',
            color: 'bg-red-100 text-red-800',
            border: 'border-red-200',
        };
    };

    const sortedData = [...attendanceData].sort((a, b) => {
        const pA =
            a.totalRecords > 0 ? (a.presentCount / a.totalRecords) * 100 : 0;
        const pB =
            b.totalRecords > 0 ? (b.presentCount / b.totalRecords) * 100 : 0;

        switch (sortBy) {
            case 'percentage':
                return pB - pA;
            case 'lectures':
                return (b.totalRecords || 0) - (a.totalRecords || 0);
            default:
                return (a.courseCode || '').localeCompare(b.courseCode || '');
        }
    });

    const filteredData = sortedData.filter((item) => {
        if (filterStatus === 'all') return true;
        const percentage =
            item.totalRecords > 0
                ? (item.presentCount / item.totalRecords) * 100
                : 0;
        if (filterStatus === 'good') return percentage >= 75;
        if (filterStatus === 'warning')
            return percentage >= 65 && percentage < 75;
        if (filterStatus === 'critical') return percentage < 65;
        return true;
    });

    const calculateOverallAttendance = () => {
        if (attendanceData.length === 0) return 0;
        const total = attendanceData.reduce((sum, item) => {
            const p =
                item.totalRecords > 0
                    ? (item.presentCount / item.totalRecords) * 100
                    : 0;
            return sum + p;
        }, 0);
        return (total / attendanceData.length).toFixed(2);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-r-transparent" />
                        <p className="mt-4 text-sm text-gray-500">
                            Loading attendance data...
                        </p>
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Error
                            </h3>
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
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">
                                Attendance
                            </h1>
                            <p className="text-gray-500">
                                Track your attendance across all subjects
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl p-6 text-white shadow-lg">
                            <p className="text-sm font-medium opacity-90 mb-1">
                                Overall Attendance
                            </p>
                            <p className="text-4xl font-bold">
                                {calculateOverallAttendance()}%
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-2">
                                    Sort By
                                </label>
                                <div className="flex gap-2">
                                    {['subject', 'percentage', 'lectures'].map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => setSortBy(key)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium ${sortBy === key
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {key[0].toUpperCase() + key.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-2">
                                    Filter By Status
                                </label>
                                <div className="flex gap-2">
                                    {['all', 'good', 'warning', 'critical'].map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => setFilterStatus(key)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === key
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {key[0].toUpperCase() + key.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredData.length === 0 ? (
                            <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                                <p className="text-gray-500">
                                    No attendance data available for the selected filter.
                                </p>
                            </div>
                        ) : (
                            filteredData.map((item, index) => {
                                const present = item.presentCount || 0;
                                const total = item.totalRecords || 0;
                                const absent = item.absentCount || 0;
                                const percentage =
                                    total > 0 ? ((present / total) * 100).toFixed(2) : 0;
                                const status = getAttendanceStatus(Number(percentage));
                                const faculty =
                                    item.records && item.records.length > 0
                                        ? item.records[0].faculty
                                        : '';

                                return (
                                    <div
                                        key={index}
                                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300"
                                    >
                                        <div className="flex items-start justify-between mb-6">
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {item.courseCode || 'N/A'}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedCourse(item);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-2 cursor-pointer rounded-lg hover:bg-gray-100"
                                                >
                                                    <Info className="h-5 w-5 text-gray-600" />
                                                </button>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color} border ${status.border}`}
                                                >
                                                    {status.label}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-center mb-6">
                                            <p className="text-3xl font-bold">{percentage}%</p>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500">Present</p>
                                                <p className="font-bold text-green-600">{present}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500">Absent</p>
                                                <p className="font-bold text-red-600">{absent}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500">Total</p>
                                                <p className="font-bold">{total}</p>
                                            </div>
                                        </div>

                                        {faculty && (
                                            <div className="mt-4 pt-4 border-t">
                                                <p className="text-xs text-gray-500">Faculty</p>
                                                <p className="text-sm font-semibold">{faculty}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
                {/* Legend */}
                <div className="bg-gray-50 rounded-2xl shadow-sm border border-gray-100 p-6 m-8">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Attendance Status Guide</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-green-600"></div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Good</p>
                                <p className="text-xs text-gray-500">75% and above</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Warning</p>
                                <p className="text-xs text-gray-500">65% - 74%</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-red-600"></div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Critical</p>
                                <p className="text-xs text-gray-500">Below 65%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal */}
                {isModalOpen && selectedCourse && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                            <div className="flex items-start justify-between p-6 border-b">
                                <h2 className="text-2xl font-bold">
                                    {selectedCourse.courseCode}
                                </h2>
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setSelectedCourse(null);
                                    }}
                                    className="p-2 cursor-pointer rounded-lg hover:bg-gray-100"
                                >
                                    <X className="h-6 w-6 text-gray-600" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                                {selectedCourse.records?.map((r, i) => (
                                    <div key={i} className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex justify-between">
                                            <div>
                                                <p className="font-semibold">{r.date}</p>
                                                <p className="text-xs text-gray-500">{r.time}</p>
                                            </div>
                                            <p className="text-xs text-gray-600">{r.faculty}</p>
                                            <span
                                                className={`px-3 py-1 rounded-lg text-xs font-semibold ${r.status === 'P'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {r.status === 'P' ? 'Present' : 'Absent'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Attendance;