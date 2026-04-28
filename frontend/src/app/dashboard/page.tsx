'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, Lightbulb, Bell, Search, Activity, Loader2, ShoppingCart, Layers, X
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useTheme } from '@/components/ThemeProvider';
import { toast, Toaster } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';

export default function DashboardOverview() {
    const [mounted, setMounted] = useState(false);
    const { theme } = useTheme();
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [procuring, setProcuring] = useState(false);
    const [alerts, setAlerts] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [showNotifications, setShowNotifications] = useState(false);

    const fetchDashboard = useCallback(async () => {
        try {
            const [dashRes, alertRes] = await Promise.all([
                axios.get(`${API_URL}/dashboard`),
                axios.get(`${API_URL}/inventory/alerts`),
            ]);
            setMetrics(dashRes.data);
            setAlerts(alertRes.data);
        } catch (err) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setMounted(true);
        fetchDashboard();
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                setUser(JSON.parse(stored));
            }
        } catch(e) {}
    }, [fetchDashboard]);

    const handleProcureMaterials = async () => {
        if (!alerts?.lowMaterials?.length) {
            if (alerts?.totalMaterials === 0) {
                toast.error('No materials defined yet! Go to Inventory to add materials first.');
            } else {
                toast.info('All materials are sufficiently stocked!');
            }
            return;
        }
        setProcuring(true);
        try {
            // Auto-create delivery logs for all low-stock materials at reorder level
            const promises = alerts.lowMaterials.map((mat: any) => {
                const qty = Math.max(Number(mat.reorder_level) * 2 - Number(mat.stock_quantity), Number(mat.reorder_level));
                return axios.put(`${API_URL}/inventory/materials/${mat.id}/delivery`, {
                    quantity_added: qty,
                    supplier: 'AI Auto-Procurement'
                });
            });
            await Promise.all(promises);
            toast.success(`Procurement order created for ${alerts.lowMaterials.length} material(s)! Stock updated.`);
            fetchDashboard();
        } catch (err) {
            toast.error('Failed to create procurement orders');
        } finally {
            setProcuring(false);
        }
    };

    if (!mounted) return null;

    const isDark = theme === 'dark';

    const chartData = metrics?.weeklyTrend?.length > 0
        ? metrics.weeklyTrend.map((d: any) => ({
            name: d.day_name,
            revenue: Number(d.revenue || 0),
            profit: Number(d.profit || 0)
        }))
        : [
            { name: 'Mon', revenue: 0, profit: 0 },
            { name: 'Tue', revenue: 0, profit: 0 },
            { name: 'Wed', revenue: 0, profit: 0 },
            { name: 'Thu', revenue: 0, profit: 0 },
            { name: 'Fri', revenue: 0, profit: 0 },
            { name: 'Sat', revenue: 0, profit: 0 },
            { name: 'Sun', revenue: 0, profit: 0 },
        ];

    const formatKsh = (val: number) => {
        if (val >= 1_000_000) return `KSh ${(val / 1_000_000).toFixed(1)}M`;
        if (val >= 1_000) return `KSh ${(val / 1_000).toFixed(1)}K`;
        return `KSh ${val.toLocaleString()}`;
    };

    return (
        <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-8 font-inter transition-colors duration-300">
            <Toaster position="top-center" richColors />

            {/* Top Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors"
            >
                <div>
                    <h1 className="text-3xl font-poppins font-bold text-gray-900 dark:text-white tracking-tight">Financial Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {loading ? 'Loading data...' : metrics
                            ? `Net profit today: ${formatKsh(Math.max(0, Number(metrics.netProfit)))}`
                            : 'Welcome to SmartBiz Pro'}
                    </p>
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
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 bg-gray-50 dark:bg-slate-900/50 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:text-gray-400 transition-colors focus:outline-none"
                        >
                            <Bell size={20} />
                            {(metrics?.lowStockItems > 0 || metrics?.lowMaterialItems > 0) && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                            )}
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden"
                                >
                                    <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-between items-center">
                                        <h3 className="font-poppins font-bold text-gray-800 dark:text-white text-sm">Notifications</h3>
                                        <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar">
                                        {!alerts?.lowMaterials?.length && !alerts?.lowProducts?.length ? (
                                            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                All caught up! No new alerts.
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                {alerts?.lowMaterials?.map((mat: any) => (
                                                    <div key={`mat-${mat.id}`} className="p-3 bg-red-50/50 dark:bg-red-900/10 rounded-xl flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                                            <Layers size={14} className="text-red-600 dark:text-red-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">Material Low Stock</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{mat.name} is down to {Number(mat.stock_quantity).toFixed(1)} {mat.unit}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {alerts?.lowProducts?.map((prod: any) => (
                                                    <div key={`prod-${prod.id}`} className="p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                                            <Package size={14} className="text-amber-600 dark:text-amber-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">Product Low Stock</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{prod.name} has only {prod.stock_quantity} remaining</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={user?.role === 'cashier' ? "My Sales Today" : "Total Revenue"}
                    value={loading ? '---' : formatKsh(user?.role === 'cashier' ? (metrics?.mySalesToday || 0) : (metrics?.revenue || 0))}
                    trend={user?.role === 'cashier' ? `${metrics?.mySalesCount || 0} transactions` : `${metrics?.salesCount || 0} transactions`}
                    isPositive={true}
                    icon={DollarSign}
                    color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                    delay={0.1}
                    isDark={isDark}
                    loading={loading}
                />
                <StatCard
                    title="Total Expenses"
                    value={loading ? '---' : formatKsh(metrics?.expenses || 0)}
                    trend="All categories"
                    isPositive={false}
                    icon={TrendingDown}
                    color="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                    delay={0.2}
                    isDark={isDark}
                    loading={loading}
                />
                <StatCard
                    title="Net Profit"
                    value={loading ? '---' : formatKsh(metrics?.netProfit || 0)}
                    trend={metrics?.revenue === 0 ? 'No data' : (metrics?.netProfit >= 0 ? 'Profitable' : 'Loss')}
                    isPositive={metrics?.revenue > 0 && metrics?.netProfit >= 0}
                    icon={TrendingUp}
                    color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    delay={0.3}
                    isDark={isDark}
                    loading={loading}
                />
                <StatCard
                    title="Inventory Value"
                    value={loading ? '---' : formatKsh(metrics?.inventoryValue || 0)}
                    trend={alerts?.totalProducts === 0 ? 'Empty' : (metrics?.lowStockItems > 0 ? `${metrics.lowStockItems} low stock` : 'Well stocked')}
                    isPositive={alerts?.totalProducts > 0 && (!metrics?.lowStockItems || metrics.lowStockItems === 0)}
                    icon={Package}
                    color="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                    delay={0.4}
                    isDark={isDark}
                    loading={loading}
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
                        <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span><span className="text-gray-500">Revenue</span></span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span><span className="text-gray-500">Profit</span></span>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E2E8F0'} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#94A3B8' : '#64748B' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#94A3B8' : '#64748B' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                                        color: isDark ? '#F8FAFC' : '#0F172A'
                                    }}
                                    formatter={(val: any) => [`KSh ${Number(val).toLocaleString()}`, '']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" activeDot={{ r: 6, strokeWidth: 0 }} />
                                <Area type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" name="Profit" activeDot={{ r: 6, strokeWidth: 0 }} />
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

                        {loading ? (
                            <p className="text-emerald-50 text-sm leading-relaxed mb-4">Analyzing inventory...</p>
                        ) : (alerts?.totalMaterials === 0 && alerts?.totalProducts === 0) ? (
                            <p className="text-emerald-50 text-sm leading-relaxed mb-4">
                                💡 Welcome! Start by adding your raw materials and products in the Inventory section to see AI-driven stock insights.
                            </p>
                        ) : (alerts?.lowMaterials?.length > 0 || alerts?.lowProducts?.length > 0) ? (
                            <p className="text-emerald-50 text-sm leading-relaxed mb-4">
                                ⚠️ <strong>Inventory Alert:</strong> {alerts.lowMaterials.length + alerts.lowProducts.length} items need attention. 
                                {alerts.lowProducts.length > 0 && ` Products like ${alerts.lowProducts[0].name} are running low.`}
                                {alerts.lowMaterials.length > 0 && ` Critical materials: ${alerts.lowMaterials[0].name}.`}
                            </p>
                        ) : (
                            <p className="text-emerald-50 text-sm leading-relaxed mb-4">
                                ✅ Everything is well-stocked. Keep monitoring sales velocity for optimal replenishment timing.
                            </p>
                        )}

                        <button
                            onClick={() => {
                                if (alerts?.lowMaterials?.length > 0) handleProcureMaterials();
                                else window.location.href = '/dashboard/inventory';
                            }}
                            disabled={procuring}
                            className="w-full py-2.5 bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {procuring ? <Loader2 size={16} className="animate-spin" /> : (
                                alerts?.lowMaterials?.length > 0 ? <ShoppingCart size={16} /> : 
                                alerts?.lowProducts?.length > 0 ? <Activity size={16} /> : <Package size={16} />
                            )}
                            {procuring ? 'Processing...' : (
                                alerts?.lowMaterials?.length > 0 ? 'Procure Materials' :
                                alerts?.lowProducts?.length > 0 ? 'Schedule Production' : 'Manage Inventory'
                            )}
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
                            {loading ? (
                                <div className="text-sm text-gray-400">Loading alerts...</div>
                            ) : (
                                <>
                                    {alerts?.lowMaterials?.slice(0, 2).map((mat: any) => (
                                        <div key={mat.id} className="flex gap-3 items-start p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                                            <Layers className="text-red-500 mt-0.5 shrink-0" size={16} />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Reorder Alert</p>
                                                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{mat.name}: only {Number(mat.stock_quantity).toFixed(1)} {mat.unit} remaining.</p>
                                            </div>
                                        </div>
                                    ))}
                                    {alerts?.lowProducts?.slice(0, 1).map((prod: any) => (
                                        <div key={prod.id} className="flex gap-3 items-start p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                                            <AlertTriangle className="text-amber-500 mt-0.5 shrink-0" size={16} />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Low Stock Product</p>
                                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{prod.name}: {prod.stock_quantity} units left.</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!alerts?.lowMaterials?.length && !alerts?.lowProducts?.length) && (
                                        <div className="text-sm text-gray-400 text-center py-2">
                                            {alerts?.totalProducts === 0 ? "No inventory items tracked yet." : "✅ No alerts. All systems normal."}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, trend, isPositive, icon: Icon, color, delay, isDark, loading }: any) {
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
                    {loading ? (
                        <div className="h-8 w-24 bg-gray-100 dark:bg-slate-700 rounded-lg animate-pulse" />
                    ) : (
                        <h4 className="text-2xl font-bold font-mono text-gray-900 dark:text-white tracking-tight">{value}</h4>
                    )}
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} shadow-inner`}>
                    <Icon size={24} />
                </div>
            </div>

            <div className="flex items-center gap-1.5 relative z-10">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                    {trend}
                </span>
            </div>
        </motion.div>
    );
}
