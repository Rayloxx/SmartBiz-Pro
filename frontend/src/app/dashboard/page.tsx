'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, Lightbulb, Bell, Search, Activity
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useTheme } from '@/components/ThemeProvider';

const revenueData = [
    { name: 'Mon', revenue: 12000, profit: 4500 },
    { name: 'Tue', revenue: 15400, profit: 5800 },
    { name: 'Wed', revenue: 11200, profit: 3900 },
    { name: 'Thu', revenue: 18500, profit: 7200 },
    { name: 'Fri', revenue: 22000, profit: 8900 },
    { name: 'Sat', revenue: 25400, profit: 10200 },
    { name: 'Sun', revenue: 19800, profit: 7500 },
];

export default function DashboardOverview() {
    const [mounted, setMounted] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const isDark = theme === 'dark';

    return (
        <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-8 font-inter transition-colors duration-300">

            {/* Top Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors"
            >
                <div>
                    <h1 className="text-3xl font-poppins font-bold text-gray-900 dark:text-white tracking-tight">Financial Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Today your business made <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">KSh 12,450</span> profit. Great work!</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm text-gray-800 dark:text-white"
                        />
                    </div>
                    <button className="relative p-2 bg-gray-50 dark:bg-slate-900/50 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:text-gray-400 transition-colors">
                        <Bell size={20} />
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                    </button>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value="KSh 84,250"
                    trend="+12.5%"
                    isPositive={true}
                    icon={DollarSign}
                    color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                    delay={0.1}
                    isDark={isDark}
                />
                <StatCard
                    title="Total Expenses"
                    value="KSh 28,400"
                    trend="-2.4%"
                    isPositive={true}
                    icon={TrendingDown}
                    color="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                    delay={0.2}
                    isDark={isDark}
                />
                <StatCard
                    title="Net Profit"
                    value="KSh 55,850"
                    trend="+18.2%"
                    isPositive={true}
                    icon={TrendingUp}
                    color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    delay={0.3}
                    isDark={isDark}
                />
                <StatCard
                    title="Inventory Level"
                    value="Low"
                    trend="Check Stock"
                    isPositive={false}
                    icon={Package}
                    color="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                    delay={0.4}
                    isDark={isDark}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-poppins font-bold text-gray-800 dark:text-white text-lg">Revenue vs Profit (Last 7 Days)</h3>
                        <select className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-600 text-sm text-gray-700 dark:text-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                            <option>This Week</option>
                            <option>This Month</option>
                            <option>This Year</option>
                        </select>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E2E8F0'} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: isDark ? '#94A3B8' : '#64748B' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: isDark ? '#94A3B8' : '#64748B' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                                        color: isDark ? '#F8FAFC' : '#0F172A'
                                    }}
                                    itemStyle={{ fontWeight: 600 }}
                                    labelStyle={{ color: isDark ? '#94A3B8' : '#64748B', marginBottom: '4px' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (KSh)" activeDot={{ r: 6, strokeWidth: 0 }} />
                                <Area type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" name="Profit (KSh)" activeDot={{ r: 6, strokeWidth: 0 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Side Panels */}
                <div className="space-y-6">
                    {/* Smart Insights */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="bg-gradient-to-br from-[#059669] to-[#065F46] dark:from-emerald-600 dark:to-emerald-800 rounded-3xl p-6 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden"
                    >
                        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/20 rounded-full mix-blend-overlay filter blur-xl opacity-50"></div>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <Lightbulb className="text-amber-300" size={24} />
                            </div>
                            <h3 className="font-poppins font-bold text-lg">AI Insight</h3>
                        </div>

                        <p className="text-emerald-50 text-sm leading-relaxed mb-4">
                            Stock of "Strawberry Yoghurt" will run out in 2 days based on current sales speed. Reorder now to avoid profit loss.
                        </p>

                        <button className="w-full py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl text-sm font-semibold transition-all">
                            Procure Materials
                        </button>
                    </motion.div>

                    {/* Alerts Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors"
                    >
                        <h3 className="font-poppins font-bold text-gray-800 dark:text-white text-lg mb-4 flex items-center gap-2">
                            <Activity className="text-red-500" size={20} /> Action Needed
                        </h3>

                        <div className="space-y-3">
                            <div className="flex gap-3 items-start p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                                <AlertTriangle className="text-red-500 mt-0.5" size={16} />
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Reorder Alert</p>
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Sugar 50kg is below minimum stock.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                                <TrendingUp className="text-amber-500 mt-0.5" size={16} />
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">High Demand</p>
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Sales are 40% higher than last Sunday.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, trend, isPositive, icon: Icon, color, delay, isDark }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            whileHover={{ y: -5, boxShadow: isDark ? "0 10px 25px -5px rgba(0, 0, 0, 0.4)" : "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}
            className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden group transition-colors"
        >
            <div className={`absolute -right-6 -top-6 w-24 h-24 ${color.split(' ')[0]} rounded-full opacity-50 dark:opacity-20 mix-blend-multiply group-hover:scale-150 transition-transform duration-500`}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
                    <h4 className="text-2xl font-bold font-mono text-gray-900 dark:text-white tracking-tight">{value}</h4>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} shadow-inner`}>
                    <Icon size={24} />
                </div>
            </div>

            <div className="flex items-center gap-1.5 relative z-10">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                    {trend}
                </span>
                <span className="text-xs text-gray-400 font-medium">vs last month</span>
            </div>
        </motion.div>
    );
}
