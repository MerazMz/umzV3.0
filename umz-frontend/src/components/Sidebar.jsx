import React, { useState } from 'react';
import {
    LayoutDashboard,
    ListTodo,
    Package,
    MessageSquare,
    Users,
    Shield,
    Lock,
    AlertCircle,
    Settings,
    HelpCircle,
    ChevronRight,
    Menu,
    X
} from 'lucide-react';

const Sidebar = () => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const menuSections = [
        {
            title: "General",
            items: [
                { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
                { name: "Tasks", icon: ListTodo, path: "/tasks", active: true },
                { name: "Apps", icon: Package, path: "/apps" },
                { name: "Chats", icon: MessageSquare, path: "/chats", badge: 3 },
                { name: "Users", icon: Users, path: "/users" },
            ]
        },
        {
            title: "Pages",
            items: [
                { name: "Auth", icon: Lock, path: "/auth", hasChevron: true },
                { name: "Errors", icon: AlertCircle, path: "/errors", hasChevron: true },
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
                                    return (
                                        <a
                                            key={itemIndex}
                                            href={item.path}
                                            className={`
                                                flex items-center justify-between px-3 py-2 rounded-lg
                                                text-sm font-medium transition-colors
                                                ${item.active
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
                                        </a>
                                    );
                                })}
                            </nav>

                            {/* "Secured by Clerk" Special Item (after General section) */}
                            {section.title === "General" && (
                                <div className="mt-1">
                                    <a
                                        href="#"
                                        className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Shield className="h-5 w-5" />
                                            <span>Secured by Clerk</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </a>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* User Profile Section */}
                <div className="border-t border-gray-200 p-4">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 text-white font-semibold text-sm">
                            SN
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                satnaing
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                satnaingdev@gmail.com
                            </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
