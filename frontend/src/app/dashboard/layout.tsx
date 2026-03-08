'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    ShoppingCart,
    Receipt,
    Box,
    Layers,
    Factory,
    BarChart4,
    Users,
    Settings,
    LogOut,
    Menu,
    X
} from 'lucide-react';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Sales', href: '/dashboard/sales', icon: ShoppingCart },
    { name: 'Expenses', href: '/dashboard/expenses', icon: Receipt },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Box },
    { name: 'Raw Materials', href: '/dashboard/materials', icon: Layers },
    { name: 'Production', href: '/dashboard/production', icon: Factory },
    { name: 'Reports & Insights', href: '/dashboard/reports', icon: BarChart4 },
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();

    return (
        <div className="flex h-screen bg-[#F8FAFC] dark:bg-slate-900 transition-colors duration-300">
            {/* Mobile sidebar toggle */}
            <button
                className="lg:hidden absolute top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-slate-800 shadow-md text-[var(--color-secondary)] dark:text-emerald-400 border dark:border-slate-700"
                onClick={() => setSidebarOpen(!isSidebarOpen)}
            >
                {isSidebarOpen ? <X /> : <Menu />}
            </button>

            {/* Sidebar */}
            <motion.aside
                initial={{ x: 0 }}
                animate={{ x: isSidebarOpen ? 0 : -300 }}
                className="w-72 bg-white dark:bg-slate-800 shadow-xl flex flex-col fixed lg:relative z-40 h-full border-r border-gray-100 dark:border-slate-700 transition-colors"
            >
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-[#10B981] to-[#1E3A8A] rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20">
                            SB
                        </div>
                        <div>
                            <h2 className="text-xl font-poppins font-bold text-gray-800 dark:text-white tracking-tight">SmartBiz</h2>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono tracking-wider">PRO EDITION</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.name} href={item.href}>
                                <motion.div
                                    whileHover={{ x: 5 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-inter text-sm ${isActive
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold shadow-sm border border-emerald-100 dark:border-emerald-900/30'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                        }`}
                                >
                                    <item.icon size={20} className={isActive ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'} />
                                    {item.name}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute left-0 w-1 h-8 bg-emerald-500 rounded-r-full"
                                            initial={false}
                                        />
                                    )}
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-slate-700">
                    <Link href="/">
                        <div className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors cursor-pointer text-sm font-medium border border-transparent hover:border-red-100 dark:hover:border-red-900/20">
                            <LogOut size={20} />
                            Sign Out
                        </div>
                    </Link>
                    <div className="mt-4 flex items-center gap-3 px-4 py-2">
                        <div className="w-10 h-10 rounded-full bg-blue-900 border-2 border-emerald-400 flex items-center justify-center text-white font-bold text-xs ring-4 ring-emerald-50 dark:ring-slate-700">
                            AD
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-white">Admin User</p>
                            <p className="text-xs text-gray-400">Owner</p>
                        </div>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main className={`flex-1 overflow-y-auto transition-all duration-300 lg:ml-0 bg-[#F8FAFC] dark:bg-slate-900`}>
                {children}
            </main>
        </div>
    );
}
