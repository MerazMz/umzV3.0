import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Search, TrendingUp, Users, Award, Calendar, Globe, MapPin } from 'lucide-react';
import Sidebar from './Sidebar';

const Ranking = () => {
    const [regno, setRegno] = useState('');
    const [loading, setLoading] = useState(false);
    const [studentData, setStudentData] = useState(null);
    const [error, setError] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check authentication status
    useEffect(() => {
        const cookies = localStorage.getItem('umz_cookies');
        setIsAuthenticated(!!cookies);
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();

        if (!regno.trim()) {
            setError('Please enter a registration number');
            return;
        }

        setLoading(true);
        setError('');
        setStudentData(null);

        try {
            const url = "http://localhost:3001/api/ranking";
            const payload = { registrationNumber: regno };

            const response = await axios.post(url, payload);
            setStudentData(response.data.data);
        } catch (err) {
            console.error('Error fetching ranking:', err);
            setError(err.response?.data?.message || 'Failed to fetch student ranking. Please check the registration number and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setRegno('');
        setStudentData(null);
        setError('');
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {isAuthenticated && <Sidebar />}

            <main className={`flex-1 overflow-y-auto p-6 lg:p-10 ${!isAuthenticated ? 'mx-auto max-w-7xl' : ''}`}>
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Student Ranking</h1>
                        <p className="text-gray-500 dark:text-gray-400">Search for student academic performance and ranking</p>
                    </div>

                    {/* Search Form */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="regno"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    Registration Number
                                </label>
                                <div className="relative">
                                    <input
                                        id="regno"
                                        type="text"
                                        value={regno}
                                        onChange={(e) => setRegno(e.target.value)}
                                        placeholder="Enter the regno"
                                        className="w-full px-4 py-3 pl-11 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-all"
                                        disabled={loading}
                                    />
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 dark:bg-white dark:hover:bg-gray-100 dark:disabled:bg-gray-600 text-white dark:text-gray-900 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                                            <span>Searching...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Search className="h-5 w-5" />
                                            <span>Search</span>
                                        </>
                                    )}
                                </button>

                                {studentData && (
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="px-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 rounded-lg transition-colors"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Error Message */}
                        {error && (
                            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    {studentData && (
                        <div className="space-y-6">
                            {/* Student Info Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                            {studentData.Name}
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {studentData.RegistrationNumber}
                                        </p>
                                    </div>
                                    <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                                            {studentData.Course}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Batch Year</p>
                                            <p className="text-base font-semibold text-gray-900 dark:text-white">
                                                {studentData.BatchYear}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <Award className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">CGPA</p>
                                            <p className="text-base font-semibold text-gray-900 dark:text-white">
                                                {studentData.CGPA}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">State</p>
                                            <p className="text-base font-semibold text-gray-900 dark:text-white">
                                                {studentData.State}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <Globe className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Country</p>
                                            <p className="text-base font-semibold text-gray-900 dark:text-white">
                                                {studentData.Country}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Ranking Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <Trophy className="h-8 w-8 text-gray-900 dark:text-white" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Academic Ranking</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Performance statistics</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Trophy className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rank</p>
                                        </div>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white">#{studentData.Rank}</p>
                                    </div>

                                    <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Percentile</p>
                                        </div>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white">Top {studentData.Percentage}%</p>
                                    </div>

                                    <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
                                        </div>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{studentData.TotalStudents.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Gender Info */}
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Award className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Gender</p>
                                            <p className="text-base font-semibold text-gray-900 dark:text-white">
                                                {studentData.Gender === 'M' ? 'Male' : studentData.Gender === 'F' ? 'Female' : studentData.Gender}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!studentData && !loading && !error && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <Trophy className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Search Student Ranking
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                Enter a registration number above to view ranking information
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Ranking;
