'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit, Trash2, Mail, Database, TrendingUp, LayoutDashboard, X, Save, Eye, EyeOff, ShieldCheck, Loader2, Package } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';

const ROLES = [
    { value: 'owner', label: 'Business Owner', icon: Database, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
    { value: 'admin', label: 'System Admin', icon: ShieldCheck, color: 'text-pink-500', bg: 'bg-pink-50 border-pink-200' },
    { value: 'manager', label: 'Operations Manager', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200' },
    { value: 'cashier', label: 'Sales Cashier', icon: LayoutDashboard, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
    { value: 'inventory_staff', label: 'Inventory Manager', icon: Package, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200' },
];

const getRoleInfo = (role: string) => ROLES.find(r => r.value === role.toLowerCase()) || ROLES[3]; // logic fallback to cashier
const getInitials = (username: string) => username.slice(0, 2).toUpperCase();

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    // Add form
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('cashier');
    const [showPassword, setShowPassword] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/users`);
            setUsers(res.data);
        } catch (err) {
            toast.error('Failed to load team members');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername || !newPassword) return;
        setSubmitting(true);
        try {
            const res = await axios.post(`${API_URL}/users`, {
                username: newUsername,
                password: newPassword,
                role: newRole
            });
            setUsers([...users, res.data]);
            toast.success(`${newUsername} has been added to the team!`);
            setIsAddModalOpen(false);
            setNewUsername(''); setNewPassword(''); setNewRole('cashier');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to add member');
        } finally {
            setSubmitting(false);
        }
    };

    const openEdit = (user: any) => {
        setEditingUser({ ...user });
        setIsEditModalOpen(true);
    };

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setSubmitting(true);
        try {
            const res = await axios.put(`${API_URL}/users/${editingUser.id}`, {
                username: editingUser.username,
                role: editingUser.role
            });
            setUsers(users.map(u => u.id === editingUser.id ? res.data : u));
            toast.success('User profile updated!');
            setIsEditModalOpen(false);
            setEditingUser(null);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async (id: number, username: string) => {
        if (!window.confirm(`Remove "${username}" from the team? This cannot be undone.`)) return;
        try {
            await axios.delete(`${API_URL}/users/${id}`);
            setUsers(users.filter(u => u.id !== id));
            toast.success('Team member removed');
        } catch (err) {
            toast.error('Failed to remove user');
        }
    };

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
                        <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center">
                            <Users size={24} />
                        </div>
                        Team Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 ml-15">Manage roles, invite staff, and control system access.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-semibold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all hover:-translate-y-0.5"
                >
                    <Plus size={20} /> Add Member
                </button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Roles Overview */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-1 space-y-4"
                >
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-poppins font-bold text-gray-800 text-lg mb-4">Role Hierarchy</h3>
                        <div className="space-y-3">
                            {ROLES.slice(0, 4).map((role) => {
                                const count = users.filter(u => u.role === role.value).length;
                                const RoleIcon = role.icon;
                                return (
                                    <div key={role.value} className={`p-3 rounded-xl border flex items-center gap-3 ${role.bg}`}>
                                        <RoleIcon className={role.color} size={18} />
                                        <div className="flex-1">
                                            <span className="text-sm font-semibold text-gray-700">{role.label}</span>
                                        </div>
                                        <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${count > 0 ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-400'}`}>
                                            {count}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-400 font-medium">
                                Total Members: <strong className="text-gray-700">{users.length}</strong>
                            </p>
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
                    {loading ? (
                        <div className="flex items-center justify-center p-16 text-gray-400">
                            <Loader2 className="animate-spin mr-2" size={20} /> Loading team members...
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                                        <th className="p-6 font-semibold">Team Member</th>
                                        <th className="p-6 font-semibold">Role</th>
                                        <th className="p-6 font-semibold">Joined</th>
                                        <th className="p-6 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    <AnimatePresence>
                                        {users.map((user, i) => {
                                            const roleInfo = getRoleInfo(user.role);
                                            const RoleIcon = roleInfo.icon;
                                            return (
                                                <motion.tr
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    key={user.id}
                                                    className="hover:bg-pink-50/10 transition-colors"
                                                >
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm shadow-inner border border-pink-200">
                                                                {getInitials(user.username)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-800 text-sm">{user.username}</p>
                                                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Mail size={11} />ID: {user.id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 w-fit ${roleInfo.bg}`}>
                                                            <RoleIcon size={12} className={roleInfo.color} />
                                                            {roleInfo.label}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 text-sm font-mono text-gray-500">
                                                        {new Date(user.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex items-center justify-end gap-2 text-gray-400">
                                                            <button onClick={() => openEdit(user)} className="p-2 hover:bg-blue-100 hover:text-blue-600 rounded-xl transition-colors" title="Edit user">
                                                                <Edit size={16} />
                                                            </button>
                                                            <button onClick={() => handleDeleteUser(user.id, user.username)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors" title="Remove user">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                            {users.length === 0 && (
                                <div className="p-10 text-center text-gray-400">
                                    No team members yet. Add your first member!
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Add Member Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
                    >
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative"
                        >
                            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors" type="button">
                                <X size={24} />
                            </button>
                            <h2 className="text-2xl font-bold font-poppins text-gray-900 mb-6">Add Team Member</h2>
                            <form onSubmit={handleAddUser} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Username *</label>
                                    <input required value={newUsername} onChange={e => setNewUsername(e.target.value)} type="text"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm font-medium"
                                        placeholder="E.g. jane_cashier" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Password *</label>
                                    <div className="relative">
                                        <input required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                            type={showPassword ? 'text' : 'password'}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm font-medium pr-12"
                                            placeholder="Minimum 6 characters" minLength={6} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Role / Permission Level</label>
                                    <select value={newRole} onChange={e => setNewRole(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm font-medium cursor-pointer">
                                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
                                <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={submitting}
                                    className="w-full py-4 mt-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 transition-all">
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    {submitting ? 'Adding...' : 'Add to Team'}
                                </motion.button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit User Modal */}
            <AnimatePresence>
                {isEditModalOpen && editingUser && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
                    >
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative"
                        >
                            <button onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors" type="button">
                                <X size={24} />
                            </button>
                            <h2 className="text-2xl font-bold font-poppins text-gray-900 mb-6">Edit Member</h2>
                            <form onSubmit={handleEditUser} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Username</label>
                                    <input required value={editingUser.username}
                                        onChange={e => setEditingUser({ ...editingUser, username: e.target.value })}
                                        type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm font-medium" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Role</label>
                                    <select value={editingUser.role}
                                        onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm font-medium cursor-pointer">
                                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
                                <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={submitting}
                                    className="w-full py-4 mt-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 transition-all">
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    {submitting ? 'Saving...' : 'Update Member'}
                                </motion.button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
