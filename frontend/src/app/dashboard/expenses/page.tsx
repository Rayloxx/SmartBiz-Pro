'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Search, Plus, Calendar, Filter, X } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { toast, Toaster } from 'sonner';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const expenseCategories = [
    { name: 'Rent', color: '#3B82F6' },
    { name: 'Transport', color: '#F59E0B' },
    { name: 'Utilities', color: '#10B981' },
    { name: 'Salaries', color: '#8B5CF6' },
    { name: 'Packaging', color: '#EC4899' },
    { name: 'Marketing', color: '#64748B' },
    { name: 'Equipment', color: '#14B8A6' },
    { name: 'Other', color: '#94A3B8' }
];

export default function ExpensesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [expenses, setExpenses] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [desc, setDesc] = useState('');
    const [amt, setAmt] = useState('');
    const [cat, setCat] = useState('Transport');
    const [ref, setRef] = useState('');

    const fetchExpenses = async () => {
        try {
            const res = await axios.get(`${API_URL}/expenses`);
            setExpenses(res.data);
            setIsLoading(false);
        } catch (err) {
            toast.error('Failed to load expenses');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!desc || !amt) return;

        try {
            const payload = {
                category: cat,
                description: desc,
                amount: Number(amt),
                reference_code: ref
            };
            const res = await axios.post(`${API_URL}/expenses`, payload);
            setExpenses([res.data, ...expenses]);
            toast.success('Successfully journaled expense flow.');
            setIsModalOpen(false);
            setDesc(''); setAmt(''); setCat('Transport'); setRef('');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to record expense');
        }
    };

    const filteredExpenses = expenses.filter(e => e.description?.toLowerCase().includes(searchTerm.toLowerCase()));

    // Analytics Calculations
    const categoryTotals = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
        return acc;
    }, {} as Record<string, number>);

    const pieData = Object.keys(categoryTotals).map(key => ({
        name: key,
        value: categoryTotals[key],
        color: expenseCategories.find(c => c.name === key)?.color || '#64748B'
    })).filter(x => x.value > 0);

    const totalSpent = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

    // Simple Monthly grouping mocking for chart from real data
    const monthlyTrend = [
        { name: 'Prev', amount: totalSpent * 0.8 },
        { name: 'Current', amount: totalSpent }
    ];

    return (
        <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-8 font-inter">
            <Toaster position="top-center" richColors />
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
            >
                <div>
                    <h1 className="text-3xl font-poppins font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                            <Receipt size={24} />
                        </div>
                        Expense Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 ml-15">Track automated outflows, categorization & budget limits.</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all hover:-translate-y-0.5"
                >
                    <Plus size={20} />
                    Record Expense
                </button>
            </motion.div>

            {/* Analytics Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Trend Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-poppins font-bold text-gray-800 text-lg">Expense Flow Trend</h3>
                            <p className="text-sm text-gray-400 font-medium">Monitoring capital outflows</p>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value) => [`KSh ${value}`, 'Amount']}
                                />
                                <Bar dataKey="amount" radius={[6, 6, 6, 6]}>
                                    {monthlyTrend.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === monthlyTrend.length - 1 ? '#EF4444' : '#FCA5A5'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Breakdown Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col"
                >
                    <h3 className="font-poppins font-bold text-gray-800 text-lg mb-2">Category Breakdown</h3>
                    <p className="text-sm text-gray-400 font-medium mb-4">Total Spending Record</p>

                    <div className="flex-1 flex flex-col justify-center items-center relative">
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => `KSh ${Number(value).toLocaleString()}`}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xl font-bold font-mono text-gray-900">
                                {totalSpent >= 1000 ? (totalSpent / 1000).toFixed(1) + 'K' : totalSpent}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">Total (KSh)</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Transactions List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h3 className="font-poppins font-bold text-gray-800 text-lg">Recent Expenses</h3>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-sm"
                            />
                        </div>
                        <button className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                    {isLoading ? (
                        <div className="flex justify-center p-12 text-gray-400">Loading expenses log...</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-semibold">ID</th>
                                    <th className="p-4 font-semibold">Date</th>
                                    <th className="p-4 font-semibold">Category</th>
                                    <th className="p-4 font-semibold text-center">Description & Ref</th>
                                    <th className="p-4 font-semibold text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <AnimatePresence>
                                    {filteredExpenses.map((expense, i) => {
                                        const catColor = expenseCategories.find(c => c.name === expense.category)?.color || '#64748B';
                                        return (
                                            <motion.tr
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                transition={{ delay: Math.min(i * 0.05, 0.3) }}
                                                key={expense.id}
                                                className="hover:bg-gray-50/50 transition-colors"
                                            >
                                                <td className="p-4">
                                                    <span className="font-mono text-xs font-bold bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                                                        EXP-{expense.id}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm text-gray-600 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        {new Date(expense.expense_date).toISOString().split('T')[0]}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span
                                                        className="text-xs font-bold px-3 py-1 rounded-full border"
                                                        style={{ color: catColor, backgroundColor: `${catColor}15`, borderColor: `${catColor}30` }}
                                                    >
                                                        {expense.category}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm text-gray-800 font-medium text-center">{expense.description}</td>
                                                <td className="p-4 text-right font-mono font-bold text-red-600">
                                                    - KSh {Number(expense.amount).toLocaleString()}
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                    {!isLoading && filteredExpenses.length === 0 && (
                        <div className="p-6 text-center text-gray-500">No expenses recorded yet.</div>
                    )}
                </div>
            </motion.div >

            {/* Modal Overlay */}
            <AnimatePresence>
                {
                    isModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative"
                            >
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors"
                                    type="button"
                                >
                                    <X size={24} />
                                </button>

                                <h2 className="text-2xl font-bold font-poppins text-gray-900 mb-6">Record Expense</h2>

                                <form onSubmit={handleAddExpense} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Description</label>
                                        <input required value={desc} onChange={e => setDesc(e.target.value)} type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm font-medium" placeholder="E.g. Paid KPLC tokens via M-PESA" />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Category</label>
                                        <select value={cat} onChange={e => setCat(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm font-medium select-none cursor-pointer">
                                            <option>Rent</option>
                                            <option>Transport</option>
                                            <option>Utilities</option>
                                            <option>Salaries</option>
                                            <option>Packaging</option>
                                            <option>Equipment</option>
                                            <option>Marketing</option>
                                            <option>Other</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Transaction Reference Code (Optional)</label>
                                        <input value={ref} onChange={e => setRef(e.target.value)} type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-mono text-sm uppercase" placeholder="M-PESA / CHEQUE NO" />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Amount Spent (KSh)</label>
                                        <input required value={amt} onChange={e => setAmt(e.target.value)} type="number" step="0.01" min="1" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-mono text-lg font-bold" placeholder="5000" />
                                    </div>

                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        className="w-full py-4 mt-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 flex justify-center items-center gap-2 hover:shadow-red-500/50 transition-all"
                                    >
                                        <Plus size={20} />
                                        Journal Outflow
                                    </motion.button>
                                </form>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>
        </div>
    );
}
