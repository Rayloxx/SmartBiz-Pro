'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
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
    X,
    ChevronRight
} from 'lucide-react';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: 'emerald' },
    { name: 'Point of Sale', href: '/dashboard/sales', icon: ShoppingCart, color: 'emerald' },
    { name: 'Expenses', href: '/dashboard/expenses', icon: Receipt, color: 'red' },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Box, color: 'blue' },
    { name: 'Raw Materials', href: '/dashboard/materials', icon: Layers, color: 'indigo' },
    { name: 'Production', href: '/dashboard/production', icon: Factory, color: 'amber' },
    { name: 'Reports & AI', href: '/dashboard/reports', icon: BarChart4, color: 'purple' },
    { name: 'Team', href: '/dashboard/users', icon: Users, color: 'pink' },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, color: 'gray' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [user, setUser] = useState<{ username: string; role: string; token?: string } | null>(null);
    const [businessName, setBusinessName] = useState<string>('Loading...');
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        // Load user from localStorage
        try {
            const stored = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            if (stored) {
                const parsedUser = JSON.parse(stored);
                setUser({ ...parsedUser, token });
            }
        } catch { }
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch('https://smartbiz-pro-n6ic.onrender.com/api/settings', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setBusinessName(data.business_name || 'My Business');
                } else {
                    setBusinessName('My Business');
                }
            } catch (err) {
                setBusinessName('My Business');
            }
        };
        fetchSettings();
    }, []);

    const handleSignOut = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const initials = user?.username?.slice(0, 2).toUpperCase() || 'SB';
    const roleName = user?.role === 'admin' ? 'System Owner' : user?.role || 'User';

    return (
        <div className="flex h-screen bg-[#F8FAFC] dark:bg-slate-900 transition-colors duration-300">
            {/* Mobile sidebar toggle */}
            <button
                className="lg:hidden absolute top-4 left-4 z-50 p-2 rounded-xl bg-white dark:bg-slate-800 shadow-md text-emerald-600 dark:text-emerald-400 border border-gray-100 dark:border-slate-700"
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                aria-label="Toggle sidebar"
            >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Sidebar */}
            <motion.aside
                initial={{ x: 0 }}
                animate={{ x: isSidebarOpen ? 0 : -300 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-72 bg-white dark:bg-slate-800 shadow-xl flex flex-col fixed lg:relative z-40 h-full border-r border-gray-100 dark:border-slate-700 transition-colors"
            >
                {/* Logo */}
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 flex-shrink-0">
                            <Image src="/logo.svg" alt="SmartBiz Pro Logo" width={40} height={40} priority />
                        </div>
                        <div>
                            <h2 className="text-xl font-poppins font-bold text-gray-800 dark:text-white tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">SmartBiz</h2>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono tracking-wider">PRO EDITION</p>
                        </div>
                    </Link>
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">CURRENT WORKSPACE</p>
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 p-2 rounded-lg border border-gray-200 dark:border-slate-600">
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{businessName}</span>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-md cursor-pointer hover:bg-emerald-200 transition-colors" title="Switch business (Coming soon)">
                                Switch
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 custom-scrollbar">
                    {navItems.filter((item) => {
                        if (!user) return false;
                        const role = user.role.toLowerCase();
                        if (role === 'owner' || role === 'admin') return true;
                        if (role === 'cashier') return ['Dashboard', 'Point of Sale'].includes(item.name);
                        if (role === 'inventory' || role === 'inventory_staff') return ['Dashboard', 'Inventory', 'Raw Materials'].includes(item.name);
                        if (role === 'manager') return ['Dashboard', 'Point of Sale', 'Expenses', 'Inventory', 'Raw Materials', 'Production', 'Reports & AI'].includes(item.name);
                        return false;
                    }).map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.name} href={item.href}>
                                <motion.div
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.97 }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-inter text-sm relative ${isActive
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm border border-emerald-100 dark:border-emerald-900/30'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-r-full"
                                            initial={false}
                                        />
                                    )}
                                    <item.icon
                                        size={18}
                                        className={isActive ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}
                                    />
                                    <span className="flex-1">{item.name}</span>
                                    {isActive && <ChevronRight size={14} className="text-emerald-400" />}
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom: User Profile & Sign Out */}
                <div className="p-4 border-t border-gray-100 dark:border-slate-700 space-y-2">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-sm font-medium border border-transparent hover:border-red-100 dark:hover:border-red-900/20"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>

                    <div className="flex items-center gap-3 px-4 py-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1E3A8A] to-[#10B981] flex items-center justify-center text-white font-bold text-sm ring-4 ring-emerald-50 dark:ring-slate-700 flex-shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{user?.username || 'Admin'}</p>
                            <p className="text-xs text-gray-400 capitalize">{roleName}</p>
                        </div>
                    </div>
                </div>
            </motion.aside>

            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <main className={`flex-1 overflow-y-auto transition-all duration-300 bg-[#F8FAFC] dark:bg-slate-900`}>
                {children}
            </main>
        </div>
    );
}
