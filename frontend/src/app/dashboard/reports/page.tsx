'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Download, Printer, CheckCircle, Loader2, RefreshCw, TrendingUp, DollarSign, Package, Receipt } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { toast, Toaster } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';

const DATE_RANGES: Record<string, string> = {
    'Today': '1',
    'This Week': '7',
    'This Month': '30',
    'Last 90 Days': '90',
    'Year to Date': '365',
    'All Time': '9999',
};

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState('This Month');
    const [reportType, setReportType] = useState('Financial Summary');
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState<any>({});
    const [salesData, setSalesData] = useState<any[]>([]);
    const [inventoryData, setInventoryData] = useState<any[]>([]);
    const [expensesData, setExpensesData] = useState<any[]>([]);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        const days = DATE_RANGES[dateRange] || '30';
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        const startStr = startDate.toISOString().split('T')[0];

        try {
            const [dashRes, salesRes, invRes, expRes] = await Promise.all([
                axios.get(`${API_URL}/dashboard`),
                axios.get(`${API_URL}/sales`),
                axios.get(`${API_URL}/inventory/products`),
                axios.get(`${API_URL}/expenses`),
            ]);

            setMetrics(dashRes.data);

            // Process sales data (group by date)
            const saleRows = salesRes.data.filter((s: any) =>
                days === '9999' || new Date(s.sale_date) >= startDate
            );
            const saleByDate: Record<string, { revenue: number, profit: number }> = {};
            saleRows.forEach((s: any) => {
                const d = new Date(s.sale_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
                if (!saleByDate[d]) saleByDate[d] = { revenue: 0, profit: 0 };
                saleByDate[d].revenue += Number(s.total_amount);
                saleByDate[d].profit += Number(s.profit);
            });
            setSalesData(
                Object.entries(saleByDate).slice(-14).map(([name, vals]) => ({ name, ...vals }))
            );
            setInventoryData(invRes.data.slice(0, 8).map((p: any) => ({
                name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
                value: p.stock_quantity,
                fullname: p.name
            })));
            setExpensesData(expRes.data.filter((e: any) =>
                days === '9999' || new Date(e.expense_date) >= startDate
            ).slice(0, 5));
        } catch (err) {
            toast.error('Failed to load report data');
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    // CSV Export
    const exportCSV = () => {
        let csvContent = '';
        let filename = '';

        if (reportType === 'Financial Summary') {
            csvContent = 'Metric,Value\n';
            csvContent += `Total Revenue,${metrics.revenue || 0}\n`;
            csvContent += `Total Profit,${metrics.profit || 0}\n`;
            csvContent += `Total Expenses,${metrics.expenses || 0}\n`;
            csvContent += `Net Profit,${metrics.netProfit || 0}\n`;
            csvContent += `Total Transactions,${metrics.salesCount || 0}\n`;
            filename = 'financial_summary.csv';
        } else if (reportType === 'Sales Report') {
            csvContent = 'Date,Revenue (KSh),Profit (KSh)\n';
            salesData.forEach(row => {
                csvContent += `${row.name},${row.revenue},${row.profit}\n`;
            });
            filename = 'sales_report.csv';
        } else if (reportType === 'Inventory Audit') {
            csvContent = 'Product,Stock Quantity\n';
            inventoryData.forEach(row => {
                csvContent += `${row.fullname},${row.value}\n`;
            });
            filename = 'inventory_audit.csv';
        } else if (reportType === 'Expense Journal') {
            csvContent = 'Date,Category,Description,Amount (KSh)\n';
            expensesData.forEach(row => {
                csvContent += `${new Date(row.expense_date).toLocaleDateString()},${row.category},${row.description || ''},${row.amount}\n`;
            });
            filename = 'expense_journal.csv';
        }

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        toast.success(`${filename} downloaded!`);
    };

    // PDF Export (browser print)
    const exportPDF = () => {
        window.print();
        toast.success('Print dialog opened — save as PDF');
    };

    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#F97316', '#64748B'];

    return (
        <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-8 font-inter">
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
                        Business Intelligence
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 ml-15">Advanced reporting, analytics and export engine.</p>
                </div>
                <button onClick={fetchReport} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh Data
                </button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Builder panel */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
                        <h3 className="font-poppins font-bold text-gray-800 border-b border-gray-100 pb-2">Report Builder</h3>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Time Range</label>
                            <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer">
                                {Object.keys(DATE_RANGES).map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Report Module</label>
                            <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer">
                                <option>Financial Summary</option>
                                <option>Sales Report</option>
                                <option>Inventory Audit</option>
                                <option>Expense Journal</option>
                            </select>
                        </div>
                        <div className="space-y-2 pt-4">
                            <button
                                onClick={exportPDF}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-gray-800 transition-colors"
                            >
                                <Printer size={16} /> Export PDF
                            </button>
                            <button
                                onClick={exportCSV}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors"
                            >
                                <Download size={16} /> Export CSV / Excel
                            </button>
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Quick Stats</h4>
                        {[
                            { label: 'Revenue', val: `KSh ${Number(metrics.revenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500' },
                            { label: 'Net Profit', val: `KSh ${Number(metrics.netProfit || 0).toLocaleString()}`, icon: DollarSign, color: 'text-blue-500' },
                            { label: 'Transactions', val: metrics.salesCount || 0, icon: Receipt, color: 'text-purple-500' },
                            { label: 'Inventory', val: `KSh ${Number(metrics.inventoryValue || 0).toLocaleString()}`, icon: Package, color: 'text-amber-500' },
                        ].map(stat => (
                            <div key={stat.label} className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                    <stat.icon size={14} className={stat.color} />
                                    {stat.label}
                                </div>
                                <span className="text-sm font-mono font-bold text-gray-900">{stat.val}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Main Report View */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3 space-y-6">
                    <div id="printable-report" className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-poppins font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{reportType}</h2>
                                <p className="text-sm text-gray-500 font-medium">Period: {dateRange} • SmartBiz Pro Report</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Verified</p>
                                <div className="flex items-center justify-end gap-1 text-emerald-500 mt-1">
                                    <CheckCircle size={14} /> <span className="text-xs font-bold">System Data</span>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20 text-gray-400">
                                <Loader2 className="animate-spin mr-2" size={24} /> Generating report...
                            </div>
                        ) : (
                            <>
                                {/* Metric Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-6 py-8 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Revenue</p>
                                        <p className="text-3xl font-mono font-bold text-gray-900">KSh {Number(metrics.revenue || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">Net Profit</p>
                                        <p className="text-3xl font-mono font-bold text-purple-600">KSh {Number(metrics.netProfit || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Transactions</p>
                                        <p className="text-3xl font-mono font-bold text-gray-900">{metrics.salesCount || 0}</p>
                                    </div>
                                </div>

                                {/* Dynamic Chart */}
                                {reportType === 'Financial Summary' || reportType === 'Sales Report' ? (
                                    <div className="h-64 w-full">
                                        <h4 className="text-sm font-bold text-gray-700 mb-4">Revenue & Profit Trend</h4>
                                        {salesData.length === 0 ? (
                                            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No sales data for this period.</div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={salesData}>
                                                    <defs>
                                                        <linearGradient id="colorRevR" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#9333EA" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#9333EA" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="colorProR" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} formatter={(v: any) => `KSh ${Number(v).toLocaleString()}`} />
                                                    <Area type="monotone" dataKey="revenue" stroke="#9333EA" strokeWidth={2} fillOpacity={1} fill="url(#colorRevR)" name="Revenue" />
                                                    <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorProR)" name="Profit" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                ) : reportType === 'Inventory Audit' ? (
                                    <div className="h-64 w-full">
                                        <h4 className="text-sm font-bold text-gray-700 mb-4">Stock Levels by Product</h4>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={inventoryData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} formatter={(v: any, _: any, props: any) => [v, props.payload.fullname || props.dataKey]} />
                                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                                    {inventoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : reportType === 'Expense Journal' ? (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold text-gray-700 mb-2">Recent Expenses</h4>
                                        {expensesData.length === 0 ? (
                                            <div className="text-gray-400 text-sm text-center py-6">No expenses recorded in this period.</div>
                                        ) : (
                                            expensesData.map((exp: any) => (
                                                <div key={exp.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">{exp.description}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{exp.category} • {new Date(exp.expense_date).toLocaleDateString()}</p>
                                                    </div>
                                                    <span className="font-mono font-bold text-red-600 text-sm">- KSh {Number(exp.amount).toLocaleString()}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : null}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
