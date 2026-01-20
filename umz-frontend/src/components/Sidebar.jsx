import React, { useState, useEffect } from 'react';
import logoUMz from '../assets/logoUMz.png';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    CalendarCheck,
    FileText,
    Award,
    Calendar,
    MessageSquare,
    Settings,
    HelpCircle,
    ChevronRight,
    Menu,
    X,
    LogOut
} from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [studentName, setStudentName] = useState('Student');
    const [studentEmail, setStudentEmail] = useState('');
    const [studentPhoto, setStudentPhoto] = useState('');

    useEffect(() => {
        // Function to load student info from localStorage
        const loadStudentInfo = () => {
            const storedInfo = localStorage.getItem('umz_student_info');
            if (storedInfo) {
                try {
                    const info = JSON.parse(storedInfo);
                    setStudentName(info.StudentName || 'Student');
                    setStudentEmail(info.StudentEmail || '');

                    // Convert base64 StudentPicture to data URL
                    if (info.StudentPicture) {
                        setStudentPhoto(`data:image/png;base64,${info.StudentPicture}`);
                    } else {
                        setStudentPhoto('');
                    }
                } catch (error) {
                    console.error('Error parsing student info:', error);
                }
            }
        };

        // Load on mount
        loadStudentInfo();

        // Listen for storage changes (when localStorage is updated)
        window.addEventListener('storage', loadStudentInfo);

        // Also check when navigating (in case data was just fetched)
        const intervalId = setInterval(loadStudentInfo, 1000);

        // Cleanup
        return () => {
            window.removeEventListener('storage', loadStudentInfo);
            clearInterval(intervalId);
        };
    }, [location.pathname]);

    const handleLogout = () => {
        // Clear all stored data including cache
        localStorage.removeItem('umz_cookies');
        localStorage.removeItem('umz_student_info');
        localStorage.removeItem('umz_attendance_data');
        localStorage.removeItem('umz_marks_data');

        // Redirect to login
        navigate('/');
    };

    const menuSections = [
        {
            title: "General",
            items: [
                { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
                { name: "Courses", icon: MessageSquare, path: "/courses" },
                { name: "Attendance", icon: CalendarCheck, path: "/attendance" },
                { name: "Marks", icon: FileText, path: "/marks" },
                { name: "Cgpa", icon: Award, path: "/cgpa" },
                { name: "Time Table", icon: Calendar, path: "/time-table" },
            ]
        },
        {
            title: "Other",
            items: [
                { name: "Settings", icon: Settings, path: "/settings", hasChevron: true },
                { name: "Help Center", icon: HelpCircle, path: "/help" },
            ]
        }
    ];

    const getInitials = (name) => {
        if (!name) return 'ST';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                aria-label="Toggle menu"
            >
                {isMobileOpen ? (
                    <X className="h-6 w-6 text-gray-900" />
                ) : (
                    <Menu className="h-6 w-6 text-gray-900" />
                )}
            </button>

            {/* Overlay for mobile */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-40
                    w-72 bg-white border-r border-gray-200
                    flex flex-col
                    transition-transform duration-300 ease-in-out
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                {/* Logo/Branding Section */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg">
                            {/* <span className="text-white font-bold text-xl">U</span> */}
                            <img src={logoUMz} alt="" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold font-mono text-gray-900">UMZ</h1>
                            <p className="text-xs text-gray-500">UMS Made Zippy</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {menuSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="mb-6">
                            {/* Section Title */}
                            <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {section.title}
                            </h3>

                            {/* Menu Items */}
                            <nav className="space-y-1">
                                {section.items.map((item, itemIndex) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={itemIndex}
                                            to={item.path}
                                            onClick={() => setIsMobileOpen(false)}
                                            className={`
                                                flex items-center justify-between px-3 py-2 rounded-lg
                                                text-sm font-medium transition-colors
                                                ${isActive
                                                    ? 'bg-gray-100 text-gray-900'
                                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className="h-5 w-5" />
                                                <span>{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {item.badge && (
                                                    <span className="flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-gray-900 rounded-full">
                                                        {item.badge}
                                                    </span>
                                                )}
                                                {item.hasChevron && (
                                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}
                </div>

                {/* User Profile Section */}
                <div className="border-t border-gray-200 p-4">
                    {/* Profile Header - Clickable */}
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 text-white font-semibold text-sm overflow-hidden">
                            {studentPhoto ? (
                                <img
                                    src={studentPhoto}
                                    alt={studentName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div
                                className="w-full h-full flex items-center justify-center"
                                style={{ display: studentPhoto ? 'none' : 'flex' }}
                            >
                                {getInitials(studentName)}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {studentName}
                            </p>
                            {studentEmail && (
                                <p className="text-xs text-gray-500 truncate">
                                    {studentEmail}
                                </p>
                            )}
                        </div>
                        <ChevronRight
                            className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${isProfileOpen ? 'rotate-90' : ''}`}
                        />
                    </button>

                    {/* Logout Button - Collapsible */}
                    <div className={`overflow-hidden transition-all duration-200 ${isProfileOpen ? 'max-h-20 mt-2' : 'max-h-0'}`}>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
