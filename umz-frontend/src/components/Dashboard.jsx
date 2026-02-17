import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Info } from 'lucide-react';
import Sidebar from './Sidebar';
import MessagesCard from './MessagesCard';
import SeatingPlanCardCompact from './SeatingPlanCardCompact';
import { getStudentInfo, getSeatingPlan } from '../services/api';

const Dashboard = () => {
    const navigate = useNavigate();
    const [studentInfo, setStudentInfo] = useState(null);
    const [seatingPlan, setSeatingPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [hideCGPA, setHideCGPA] = useState(false);
    const [hideProfile, setHideProfile] = useState(false);



    // Load privacy settings from localStorage
    useEffect(() => {
        const loadPrivacySettings = () => {
            const savedHideCGPA = localStorage.getItem('umz_hide_cgpa') === 'true';
            const savedHideProfile = localStorage.getItem('umz_hide_profile') === 'true';
            setHideCGPA(savedHideCGPA);
            setHideProfile(savedHideProfile);
        };

        loadPrivacySettings();

        // Listen for privacy settings changes
        window.addEventListener('privacy-settings-changed', loadPrivacySettings);

        return () => {
            window.removeEventListener('privacy-settings-changed', loadPrivacySettings);
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            // First, always check for cached data
            const cachedInfo = localStorage.getItem('umz_student_info');
            if (cachedInfo) {
                try {
                    const parsed = JSON.parse(cachedInfo);
                    console.log('📦 Using cached student info');
                    setStudentInfo(parsed);
                    setLoading(false);

                    // Still fetch seating plan even with cached student info
                    const cookies = localStorage.getItem('umz_cookies');
                    if (cookies) {
                        fetchSeatingPlanData(cookies);
                    }

                    return; // Use cache, don't fetch student info again
                } catch (e) {
                    console.error('Error parsing cached student info:', e);
                    localStorage.removeItem('umz_student_info');
                }
            }

            // No cache available - check if we have cookies
            const cookies = localStorage.getItem('umz_cookies');

            if (!cookies) {
                // No cookies and no cache - show empty state
                console.log('⚠️ No cookies and no cached data');
                setLoading(false);
                setError('');
                setStudentInfo(null);
                return;
            }

            // We have cookies but no cache - fetch fresh data
            try {
                setLoading(true);
                console.log('🌐 Fetching fresh student info from API');
                const result = await getStudentInfo(cookies);
                console.log('📨 Messages in response:', result.data?.Messages);
                setStudentInfo(result.data);

                // Store student info in localStorage for caching
                localStorage.setItem('umz_student_info', JSON.stringify(result.data));

                // Fetch seating plan
                fetchSeatingPlanData(cookies);

                setError('');
            } catch (err) {
                setError(err.message);
                if (err.message.includes('session') || err.message.includes('unauthorized')) {
                    // Session expired - remove cookies but keep trying to show cached data
                    localStorage.removeItem('umz_cookies');
                }
            } finally {
                setLoading(false);
            }
        };

        // Helper function to fetch seating plan
        const fetchSeatingPlanData = async (cookies) => {
            try {
                console.log('🪑 Fetching seating plan...');
                const seatingPlanResult = await getSeatingPlan(cookies);
                console.log('📋 Seating Plan Response:', seatingPlanResult);
                console.log('📋 Seating Plan Data:', seatingPlanResult.data);
                setSeatingPlan(seatingPlanResult.data);
            } catch (seatingError) {
                console.warn('⚠️ Could not fetch seating plan:', seatingError.message);
                console.error('Full seating error:', seatingError);
                // Don't fail the entire dashboard if seating plan fails
                setSeatingPlan([]);
            }
        };

        fetchData();
    }, [navigate]);

    const getCGPAData = () => {
        if (!studentInfo?.CGPA) return [];
        const cgpa = parseFloat(studentInfo.CGPA);
        const maxCGPA = 10;
        return [
            { name: 'Achieved', value: cgpa },
            { name: 'Remaining', value: Math.max(0, maxCGPA - cgpa) }
        ];
    };

    const getAttendanceData = () => {
        if (!studentInfo?.AggAttendance) return [];
        const attendance = parseFloat(studentInfo.AggAttendance);
        return [
            { name: 'Present', value: attendance },
            { name: 'Absent', value: Math.max(0, 100 - attendance) }
        ];
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-gray-900 dark:border-white border-r-transparent"></div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                    </div>
                </main>
            </div>
        );
    }

    // Show empty/resync state when no data and no cookies
    if (!loading && !studentInfo && !error) {
        return (
            <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Data Available</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Please click <strong>Resync Data</strong> in Settings to load your information.
                        </p>
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
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error</h3>
                            <p className="text-gray-600 dark:text-gray-300">{error}</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Welcome Header with Password Expiry */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                Welcome back, {studentInfo?.StudentName?.split(' ')[0] || 'Student'}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400">Here's your academic overview</p>
                        </div>

                        {/* Password Expiry Warning - Minimal & Subtle */}
                        {studentInfo?.PasswordExpiry && (
                            // <div className="bg-yellow-50/80 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-lg px-3 py-2 max-w-xs">
                                <div className="flex items-center gap-2">
                                    <svg className="h-4 w-4 text-yellow-500 dark:text-yellow-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                                        {studentInfo.PasswordExpiry}
                                    </p>
                                </div>
                            // </div>
                        )}
                    </div>

                    {/* Profile Information - Moved to Top */}
                    {studentInfo && (
                        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden ${hideProfile ? 'relative' : ''}`}>
                            <div className={`p-8 ${hideProfile ? 'blur-md select-none pointer-events-none' : ''}`}>
                                <div className="flex items-start gap-8">
                                    {studentInfo.StudentPicture && (
                                        <img
                                            src={`data:image/png;base64,${studentInfo.StudentPicture}`}
                                            alt="Student"
                                            className="w-24 h-24 rounded-full object-cover ring-4 ring-gray-100"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{studentInfo.StudentName}</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {studentInfo.Registrationnumber && (
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Registration Number</p>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{studentInfo.Registrationnumber}</p>
                                                </div>
                                            )}
                                            {studentInfo.RollNumber && (
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Roll Number</p>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{studentInfo.RollNumber}</p>
                                                </div>
                                            )}
                                            {studentInfo.Program && (
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Program</p>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{studentInfo.Program}</p>
                                                </div>
                                            )}
                                            {studentInfo.Section && (
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Section</p>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{studentInfo.Section}</p>
                                                </div>
                                            )}
                                            {studentInfo.StudentEmail && (
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</p>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{studentInfo.StudentEmail}</p>
                                                </div>
                                            )}
                                            {studentInfo.StudentMobile && (
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mobile</p>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{studentInfo.StudentMobile}</p>
                                                </div>
                                            )}
                                            {studentInfo.DateofBirth && (
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date of Birth</p>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{studentInfo.DateofBirth}</p>
                                                </div>
                                            )}
                                            {studentInfo.Gender && (
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Gender</p>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{studentInfo.Gender}</p>
                                                </div>
                                            )}
                                            {studentInfo.BatchYear && (
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Batch</p>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{studentInfo.BatchYear}</p>
                                                </div>
                                            )}
                                            {studentInfo.PendingFee !== undefined && (
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Pending Fee</p>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{studentInfo.PendingFee}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Charts Row - CGPA, Attendance, and Seating Plan */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* CGPA Chart */}
                        {studentInfo?.CGPA && (
                            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 border border-gray-100 dark:border-gray-700 ${hideCGPA ? 'relative' : ''}`}>
                                <div className={hideCGPA ? 'blur-md select-none pointer-events-none' : ''}>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">CGPA Distribution</h3>
                                        <button
                                            onClick={() => navigate('/cgpa')}
                                            className="p-2 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            title="View detailed CGPA analysis"
                                        >
                                            <Info className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <div className="relative">
                                            <ResponsiveContainer width={200} height={200}>
                                                <PieChart>
                                                    <Pie
                                                        data={getCGPAData()}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={2}
                                                        dataKey="value"
                                                        isAnimationActive={true}
                                                    >
                                                        <Cell fill="#000000" />
                                                        <Cell fill="#F3F4F6" />
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{studentInfo.CGPA}</p>
                                                    <p className="text-xs text-gray-400">/ 10</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Attendance Chart */}
                        {studentInfo?.AggAttendance && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Attendance Overview</h3>
                                    <button
                                        onClick={() => navigate('/attendance')}
                                        className="p-2 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        title="View detailed attendance"
                                    >
                                        <Info className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-center">
                                    <div className="relative">
                                        <ResponsiveContainer width={200} height={200}>
                                            <PieChart>
                                                <Pie
                                                    data={getAttendanceData()}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    isAnimationActive={true}
                                                >
                                                    <Cell fill="#000000" />
                                                    <Cell fill="#F3F4F6" />
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{studentInfo.AggAttendance}%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Seating Plan Card - Compact */}
                        {seatingPlan !== null && (
                            <SeatingPlanCardCompact seatingPlan={seatingPlan} />
                        )}
                    </div>

                    {/* Messages Card */}
                    {studentInfo && (
                        <MessagesCard messages={studentInfo.Messages || []} />
                    )}




                    {/* Parent Information Section - Moved to Separate Card */}
                    {
                        studentInfo && (studentInfo.FatherName || studentInfo.MotherName) && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Parent Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Father */}
                                    {studentInfo.FatherName && (
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Father</p>
                                            <div className="space-y-2">
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{studentInfo.FatherName}</p>
                                                </div>
                                                {studentInfo.FatherMobile && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Mobile</p>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{studentInfo.FatherMobile}</p>
                                                    </div>
                                                )}
                                                {studentInfo.FatherEmail && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{studentInfo.FatherEmail}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Mother */}
                                    {studentInfo.MotherName && (
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Mother</p>
                                            <div className="space-y-2">
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{studentInfo.MotherName}</p>
                                                </div>
                                                {studentInfo.MotherMobile && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Mobile</p>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{studentInfo.MotherMobile}</p>
                                                    </div>
                                                )}
                                                {studentInfo.MotherEmail && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{studentInfo.MotherEmail}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }
                </div >
            </main >
        </div >
    );
};

export default Dashboard;
