'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Edit, Trash2, Mail, LayoutDashboard, Database, TrendingUp } from 'lucide-react';

const mockUsers = [
    { id: 1, name: 'Admin User', role: 'System Owner', email: 'admin@smartbiz.co.ke', status: 'Active', activity: 'Just now' },
    { id: 2, name: 'John Doe', role: 'Sales Manager', email: 'john@smartbiz.co.ke', status: 'Active', activity: '2 hrs ago' },
    { id: 3, name: 'Jane Smith', role: 'Production Lead', email: 'jane@smartbiz.co.ke', status: 'Inactive', activity: 'Yesterday' },
    { id: 4, name: 'Shop Attendant', role: 'Cashier', email: 'shop@smartbiz.co.ke', status: 'Active', activity: '5 hrs ago' },
];

export default function UsersPage() {
    return (
        <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-8 font-inter">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
            >
                <div>
                    <h1 className="text-3xl font-poppins font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center">
                            <Users size={24} />
                        </div>
                        Team Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 ml-15">Configure roles, invite staff, and monitor system access.</p>
                </div>

                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-semibold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all hover:-translate-y-0.5">
                    <Plus size={20} />
                    Invite Member
                </button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Roles overview */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-1 space-y-4"
                >
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-poppins font-bold text-gray-800 text-lg mb-4">Privileges</h3>
                        <div className="space-y-3">
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                                <Database className="text-pink-500" size={18} />
                                <span className="text-sm font-semibold text-gray-700">System Owner</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                                <TrendingUp className="text-emerald-500" size={18} />
                                <span className="text-sm font-semibold text-gray-700">Sales Manager</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                                <LayoutDashboard className="text-blue-500" size={18} />
                                <span className="text-sm font-semibold text-gray-700">Production Lead</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Users Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="p-6 font-semibold">Team Member</th>
                                    <th className="p-6 font-semibold">Role</th>
                                    <th className="p-6 font-semibold">Status</th>
                                    <th className="p-6 font-semibold">Activity</th>
                                    <th className="p-6 font-semibold text-right">Settings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {mockUsers.map((user, i) => (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        key={user.id}
                                        className="hover:bg-pink-50/10 transition-colors"
                                    >
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm shadow-inner border border-pink-200">
                                                    {user.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm tracking-tight">{user.name}</p>
                                                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5"><Mail size={12} />{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">{user.role}</span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2.5 h-2.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 shadow-emerald-400/50 shadow-sm' : 'bg-gray-300'}`}></div>
                                                <span className="text-sm font-semibold text-gray-600">{user.status}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-sm font-mono text-gray-500">
                                            {user.activity}
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center justify-end gap-2 text-gray-400">
                                                <button className="p-2 hover:bg-gray-100 hover:text-gray-800 rounded-xl transition-colors"><Edit size={16} /></button>
                                                <button className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
