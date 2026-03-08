'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Save, Store, Mail, Phone, MapPin, Banknote, Bell, Moon, Link as LinkIcon, Shield, Sun, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import axios from 'axios';
import { useTheme } from '@/components/ThemeProvider';

const API_URL = 'http://localhost:5000/api';

export default function SettingsPage() {
    const { theme, toggleTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [settings, setSettings] = useState({
        business_name: '',
        tax_pin: '',
        admin_email: '',
        phone_number: '',
        office_address: '',
        base_currency: 'Kenya Shillings (KSh)',
        vat_rate: 16,
        email_alerts: true
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${API_URL}/settings`);
            if (res.data) {
                setSettings({
                    ...res.data,
                    vat_rate: Number(res.data.vat_rate)
                });
            }
            setIsLoading(false);
        } catch (err) {
            toast.error('Failed to load system settings');
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axios.put(`${API_URL}/settings`, settings);
            toast.success('Configuration updated successfully!');
        } catch (err) {
            toast.error('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-8 font-inter">
            <Toaster position="top-center" richColors />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors"
            >
                <div>
                    <h1 className="text-3xl font-poppins font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-2xl flex items-center justify-center">
                            <Settings size={24} />
                        </div>
                        System Configuration
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-15">Manage your organization's core preferences and integrations.</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={20} />
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* General Details */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
                            <Store className="text-blue-500" size={24} />
                            <h2 className="text-xl font-poppins font-bold text-gray-800 dark:text-white">Business Profile</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Business Name</label>
                                <input
                                    type="text"
                                    value={settings.business_name}
                                    onChange={e => setSettings({ ...settings, business_name: e.target.value })}
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium text-gray-800 dark:text-white"
                                    placeholder="Enter business name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tax PIN (KRA)</label>
                                <input
                                    type="text"
                                    value={settings.tax_pin}
                                    onChange={e => setSettings({ ...settings, tax_pin: e.target.value })}
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm text-gray-800 dark:text-white"
                                    placeholder="P0XXXXXXXX"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Mail size={16} className="text-gray-400" /> Admin Email</label>
                                <input
                                    type="email"
                                    value={settings.admin_email}
                                    onChange={e => setSettings({ ...settings, admin_email: e.target.value })}
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-gray-800 dark:text-white"
                                    placeholder="admin@smartbiz.co.ke"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Phone size={16} className="text-gray-400" /> Phone Number</label>
                                <input
                                    type="text"
                                    value={settings.phone_number}
                                    onChange={e => setSettings({ ...settings, phone_number: e.target.value })}
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm text-gray-800 dark:text-white"
                                    placeholder="+254 XXX XXX XXX"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><MapPin size={16} className="text-gray-400" /> Office Address</label>
                                <input
                                    type="text"
                                    value={settings.office_address}
                                    onChange={e => setSettings({ ...settings, office_address: e.target.value })}
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-gray-800 dark:text-white"
                                    placeholder="Physical Location"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
                            <Banknote className="text-emerald-500" size={24} />
                            <h2 className="text-xl font-poppins font-bold text-gray-800 dark:text-white">Financial Configurations</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Base Currency</label>
                                <select
                                    value={settings.base_currency}
                                    onChange={e => setSettings({ ...settings, base_currency: e.target.value })}
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm text-gray-800 dark:text-white appearance-none"
                                >
                                    <option>Kenya Shillings (KSh)</option>
                                    <option>US Dollars (USD)</option>
                                    <option>Tanzanian Shillings (TZS)</option>
                                    <option>Ugandan Shillings (UGX)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Current VAT Rate (%)</label>
                                <input
                                    type="number"
                                    value={settings.vat_rate}
                                    onChange={e => setSettings({ ...settings, vat_rate: Number(e.target.value) })}
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm text-gray-800 dark:text-white"
                                    placeholder="16"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* System & Integrations Preferences */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-1 space-y-6"
                >
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors space-y-6">
                        <h3 className="font-poppins font-bold text-gray-800 dark:text-white text-lg border-b border-gray-100 dark:border-slate-700 pb-4 flex items-center gap-2">
                            <LinkIcon className="text-purple-500" size={20} /> Integrations
                        </h3>

                        <div className="space-y-4">
                            <div className="p-4 border border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10 rounded-2xl flex justify-between items-center group">
                                <div>
                                    <h4 className="font-bold text-green-900 dark:text-green-400 text-sm">M-PESA Daraja</h4>
                                    <p className="text-xs text-green-700 dark:text-green-500 mt-1">Status: Active</p>
                                </div>
                                <button
                                    onClick={() => toast.info('M-PESA Configuration interface is and admin-only gateway.')}
                                    className="px-3 py-1 bg-white dark:bg-slate-800 border border-green-200 dark:border-green-800 text-xs font-bold text-green-600 rounded-lg shadow-sm hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                                >
                                    Configure
                                </button>
                            </div>

                            <div className="p-4 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/30 rounded-2xl flex justify-between items-center group">
                                <div>
                                    <h4 className="font-bold text-gray-800 dark:text-gray-300 text-sm">KRA eTIMS</h4>
                                    <p className="text-xs text-gray-500 mt-1">Status: Disconnected</p>
                                </div>
                                <button
                                    onClick={() => toast.loading('Connecting to eTIMS secure gateway...')}
                                    className="px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-xs font-bold text-blue-600 rounded-lg shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                    Connect
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors space-y-6">
                        <h3 className="font-poppins font-bold text-gray-800 dark:text-white text-lg border-b border-gray-100 dark:border-slate-700 pb-4 flex items-center gap-2">
                            <Shield className="text-amber-500" size={20} /> Security & System
                        </h3>

                        <div className="space-y-4">
                            {/* Dark Mode Toggle */}
                            <div className="flex items-center justify-between p-2">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 dark:bg-slate-900 p-2 rounded-lg text-gray-600 dark:text-gray-400">
                                        {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Dark Mode</span>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${theme === 'dark' ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-700'}`}
                                >
                                    <motion.div
                                        animate={{ x: theme === 'dark' ? 24 : 4 }}
                                        className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-md"
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                </button>
                            </div>

                            {/* Email Alerts Toggle */}
                            <div className="flex items-center justify-between p-2">
                                <div className="flex items-center gap-3">
                                    <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg text-red-500"><Bell size={16} /></div>
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Alerts</span>
                                </div>
                                <button
                                    onClick={() => setSettings({ ...settings, email_alerts: !settings.email_alerts })}
                                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${settings.email_alerts ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-700'}`}
                                >
                                    <motion.div
                                        animate={{ x: settings.email_alerts ? 24 : 4 }}
                                        className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-md"
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                </button>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={() => toast.info('Check your admin email for password reset link.')}
                                    className="w-full py-2 bg-gray-50 dark:bg-slate-900/50 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-100 dark:border-slate-700 rounded-xl text-sm font-semibold transition-colors"
                                >
                                    Change Admin Password
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
