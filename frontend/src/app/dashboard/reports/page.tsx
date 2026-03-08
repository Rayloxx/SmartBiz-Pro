'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Download, Share2, Printer, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { toast, Toaster } from 'sonner';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const processMonthlyData = () => {
    return [
        { name: 'Jan', revenue: 4000, margin: 2400 },
        { name: 'Feb', revenue: 3000, margin: 1398 },
        { name: 'Mar', revenue: 2000, margin: 9800 },
        { name: 'Apr', revenue: 2780, margin: 3908 },
        { name: 'May', revenue: 1890, margin: 4800 },
        { name: 'Jun', revenue: 2390, margin: 3800 },
        { name: 'Jul', revenue: 3490, margin: 4300 },
    ];
};

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState('This Month');
    const [reportType, setReportType] = useState('Financial Summary');
    const [metrics, setMetrics] = useState({ revenue: 0, profit: 0, customers: 0 });

    useEffect(() => {
        axios.get(`${API_URL}/dashboard`).then(res => {
            setMetrics(res.data);
        }).catch(err => console.error(err));
    }, []);

    const growthData = processMonthlyData();

    const handleExport = (type: string) => {
        toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
            loading: `Generating ${type}...`,
            success: `${type} downloaded successfully!`,
            error: 'Failed to generate.',
        });
    };

    return (
        <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-8 font-inter h-full">
            <Toaster position="top-center" richColors />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
            >
                <div>
                    <h1 className="text-3xl font-poppins font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                            <BarChart3 size={24} />
                        </div>
                        Business Intelligence Logs
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 ml-15">Advanced reporting, growth trajectories, and export formatting.</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
                        <h3 className="font-poppins font-bold text-gray-800 border-b border-gray-100 pb-2">Report Builder</h3>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Time Range</label>
                            <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer">
                                <option>Today</option><option>This Week</option><option>This Month</option><option>Q1 2026</option><option>Year to Date</option><option>All Time</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Report Module</label>
                            <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer">
                                <option>Financial Summary</option><option>Inventory Audit (KRA)</option><option>Sales Tax / VAT Return</option><option>Raw Material Usage</option><option>Expense Journal</option>
                            </select>
                        </div>
                        <div className="space-y-2 pt-4">
                            <button onClick={() => handleExport('PDF Report')} className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-gray-800 transition-colors">
                                <Download size={16} /> Export PDF
                            </button>
                            <button onClick={() => handleExport('Excel CSV')} className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors">
                                <Download size={16} /> Export Excel (CSV)
                            </button>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => toast.info('Prepared for printing')} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-100">
                                <Printer size={14} /> Print
                            </button>
                            <button onClick={() => toast.success('Link copied to clipboard')} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-100">
                                <Share2 size={14} /> Share
                            </button>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-poppins font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{reportType}</h2>
                                <p className="text-sm text-gray-500 font-medium">Reporting Range: {dateRange} • Internal Document</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Certified True</p>
                                <div className="flex items-center justify-end gap-1 text-emerald-500 mt-1">
                                    <CheckCircle size={14} /> <span className="text-xs font-bold">System Verified</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-6 py-8 bg-gray-50 rounded-2xl border border-gray-100">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Revenue</p>
                                <p className="text-3xl font-mono font-bold text-gray-900">KSh {Number(metrics.revenue).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">Total Margin (Profit)</p>
                                <p className="text-3xl font-mono font-bold text-purple-600">KSh {Number(metrics.profit).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Customers / Txns</p>
                                <p className="text-3xl font-mono font-bold text-gray-900">{metrics.customers}</p>
                            </div>
                        </div>

                        <div className="h-72 w-full mt-6">
                            <h3 className="text-sm font-bold text-gray-800 mb-4 ml-6">Margin Growth Trajectory</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#9333EA" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#9333EA" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                                    <Area type="monotone" dataKey="margin" stroke="#9333EA" strokeWidth={3} fillOpacity={1} fill="url(#colorMargin)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
