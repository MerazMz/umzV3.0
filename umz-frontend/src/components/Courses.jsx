import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search } from 'lucide-react';
import Sidebar from './Sidebar';
import { getCourses } from '../services/api';

const Courses = () => {
    const navigate = useNavigate();
    const [courses, setCourses]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [search, setSearch]     = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const cachedCourses = localStorage.getItem('umz_courses_data');
            if (cachedCourses) {
                try {
                    setCourses(JSON.parse(cachedCourses));
                    setLoading(false);
                    return;
                } catch {
                    localStorage.removeItem('umz_courses_data');
                }
            }

            const cookies = localStorage.getItem('umz_cookies');
            if (!cookies) {
                setLoading(false);
                setCourses([]);
                return;
            }

            try {
                setLoading(true);
                const result = await getCourses(cookies);
                setCourses(result.data);
                localStorage.setItem('umz_courses_data', JSON.stringify(result.data));
            } catch (err) {
                setError(err.message);
                if (err.message.includes('session') || err.message.includes('unauthorized')) {
                    localStorage.removeItem('umz_cookies');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const attendanceBadge = (pct) => {
        const val = parseInt(pct) || 0;
        if (val >= 75) return { label: 'On Track', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
        if (val >= 65) return { label: 'At Risk',  cls: 'text-amber-700 bg-amber-50 border-amber-200'     };
        return              { label: 'Short',    cls: 'text-red-700 bg-red-50 border-red-200'             };
    };

    const filtered = courses.filter(c =>
        !search ||
        c.courseCode?.toLowerCase().includes(search.toLowerCase()) ||
        c.courseName?.toLowerCase().includes(search.toLowerCase())
    );

    /* ─── Loading ─── */
    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-gray-800 dark:border-white border-r-transparent" />
                        <p className="mt-3 text-sm text-gray-400">Loading courses…</p>
                    </div>
                </main>
            </div>
        );
    }

    /* ─── Error ─── */
    if (error) {
        return (
            <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar />
                <main className="flex-1 p-8">
                    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Error</p>
                        <p className="text-sm text-gray-500">{error}</p>
                    </div>
                </main>
            </div>
        );
    }

    /* ─── Main ─── */
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8 space-y-6">

                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Courses</h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {courses.length} enrolled this term
                            </p>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search courses…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 text-gray-900 dark:text-white placeholder-gray-400 w-56"
                            />
                        </div>
                    </div>

                    {/* Empty state */}
                    {courses.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-16 text-center">
                            <BookOpen className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-400">No courses found.</p>
                            <p className="text-xs text-gray-400 mt-1">Try resyncing your data in Settings.</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
                            <p className="text-sm text-gray-400">No courses match "<span className="font-medium">{search}</span>"</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/60">
                            {filtered.map((course, index) => {
                                const att   = parseInt(course.attendance) || 0;
                                const badge = attendanceBadge(att);

                                return (
                                    <div
                                        key={index}
                                        className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                                    >
                                        {/* Index dot */}
                                        <div className="shrink-0 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{index + 1}</span>
                                        </div>

                                        {/* Course info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                                                    {course.courseCode}
                                                </span>
                                                {course.examPattern && course.examPattern !== 'N/A' && (
                                                    <span className="text-xs text-gray-400 border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5">
                                                        {course.examPattern}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{course.courseName}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                {course.term && (
                                                    <span className="text-xs text-gray-400">Term {course.term}</span>
                                                )}
                                                {course.group && (
                                                    <>
                                                        <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>
                                                        <span className="text-xs text-gray-400">Group {course.group}</span>
                                                    </>
                                                )}
                                                {course.rollNo && (
                                                    <>
                                                        <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>
                                                        <span className="text-xs text-gray-400">Roll {course.rollNo}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Attendance */}
                                        <div className="shrink-0 text-right">
                                            <p className="text-base font-bold text-gray-900 dark:text-white">{att}%</p>
                                            <span className={`text-xs font-medium border rounded-full px-2 py-0.5 ${badge.cls}`}>
                                                {badge.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Footer legend */}
                    {courses.length > 0 && (
                        <div className="flex items-center gap-6 px-1">
                            {[
                                { label: 'On Track ≥ 75%', dot: 'bg-emerald-500' },
                                { label: 'At Risk 65–74%',  dot: 'bg-amber-500'   },
                                { label: 'Short < 65%',     dot: 'bg-red-500'     },
                            ].map(({ label, dot }) => (
                                <div key={label} className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${dot}`} />
                                    <span className="text-xs text-gray-400">{label}</span>
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
