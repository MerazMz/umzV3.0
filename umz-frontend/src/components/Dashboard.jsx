import React from 'react';
import Sidebar from './Sidebar';

const Dashboard = () => {
    return (
        <div className="flex min-h-screen bg-white">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 p-8 lg:p-12">
                <div className="max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Dashboard
                        </h1>
                        <p className="text-gray-600">
                            Welcome to your UMZ Dashboard
                        </p>
                    </div>

                    {/* Dashboard Content - Grid of Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Card 1 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Quick Stats
                            </h3>
                            <p className="text-gray-600 text-sm">
                                View your academic statistics and performance metrics
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Attendance
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Track your attendance across all courses
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Grades
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Check your grades and academic progress
                            </p>
                        </div>

                        {/* Card 4 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Schedule
                            </h3>
                            <p className="text-gray-600 text-sm">
                                View your class schedule and upcoming events
                            </p>
                        </div>

                        {/* Card 5 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Announcements
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Stay updated with latest announcements
                            </p>
                        </div>

                        {/* Card 6 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Resources
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Access course materials and resources
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
