import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Users, FileText, Award, TrendingUp } from 'lucide-react';
import Sidebar from './Sidebar';
import { getCourses } from '../services/api';

const Courses = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            // First, always check for cached data
            const cachedCourses = localStorage.getItem('umz_courses_data');
            if (cachedCourses) {
                try {
                    const parsed = JSON.parse(cachedCourses);
                    console.log('📦 Using cached courses data');
                    setCourses(parsed);
                    setLoading(false);
                    return; // Use cache, don't fetch
                } catch (e) {
                    console.error('Error parsing cached courses data:', e);
                    localStorage.removeItem('umz_courses_data');
                }
            }

            // No cache available - check if we have cookies
            const cookies = localStorage.getItem('umz_cookies');

            if (!cookies) {
                // No cookies and no cache - show empty state
                console.log('⚠️ No cookies and no cached courses');
                setLoading(false);
                setError('');
                setCourses([]);
                return;
            }

            // We have cookies but no cache - fetch fresh data
            try {
                setLoading(true);
                console.log('🌐 Fetching fresh courses from API');
                const result = await getCourses(cookies);
                setCourses(result.data);

                // Store courses data in localStorage for caching
                localStorage.setItem('umz_courses_data', JSON.stringify(result.data));

                setError('');
            } catch (err) {
                setError(err.message);
                if (err.message.includes('session') || err.message.includes('unauthorized')) {
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
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-gray-900 border-r-transparent"></div>
                        <p className="mt-4 text-sm text-gray-500">Loading courses...</p>
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
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-gray-900 rounded-xl">
                            <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
                            <p className="text-gray-500">Your registered courses for this term</p>
                        </div>
                    </div>

                    {/* Courses Count */}
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-90">Total Enrolled Courses</p>
                                <p className="text-4xl font-bold mt-1">{courses.length}</p>
                            </div>
                            <Award className="h-16 w-16 opacity-20" />
                        </div>
                    </div>

                    {/* Courses Grid */}
                    {courses.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                <BookOpen className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500">No courses found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {courses.map((course, index) => (
                                <div
                                    key={index}
                                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden"
                                >
                                    {/* Course Header */}
                                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="inline-block px-3 py-1 bg-white/10 rounded-lg mb-3">
                                                    <p className="text-xs font-semibold text-white uppercase tracking-wider">
                                                        {course.courseCode}
                                                    </p>
                                                </div>
                                                <h3 className="text-lg font-bold text-white leading-tight">
                                                    {course.courseName}
                                                </h3>
                                            </div>
                                            <div className="ml-4">
                                                <BookOpen className="h-6 w-6 text-white/60" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Course Details */}
                                    <div className="p-6 space-y-4">
                                        {/* Attendance */}
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Attendance</p>
                                                    <p className="text-2xl font-bold text-gray-900">{course.attendance}%</p>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${parseInt(course.attendance) >= 75
                                                ? 'bg-green-100 text-green-700'
                                                : parseInt(course.attendance) >= 50
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {parseInt(course.attendance) >= 75 ? 'Good' : parseInt(course.attendance) >= 50 ? 'Average' : 'Low'}
                                            </div>
                                        </div>

                                        {/* Course Info Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-start gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-xs text-gray-500">Term</p>
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{course.term}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <Users className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-xs text-gray-500">Group</p>
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{course.group || 'N/A'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-xs text-gray-500">Roll No</p>
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{course.rollNo || 'N/A'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <Award className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-xs text-gray-500">Exam Pattern</p>
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{course.examPattern || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Courses;
