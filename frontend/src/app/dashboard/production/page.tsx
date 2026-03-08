'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Factory, Plus, Archive, History, ArrowRight, Settings2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function ProductionPage() {
    const [activeTab, setActiveTab] = useState('New Batch');
    const [history, setHistory] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    // Form State
    const [rawMatId, setRawMatId] = useState('');
    const [rawUsed, setRawUsed] = useState('');
    const [prodTargetId, setProdTargetId] = useState('');
    const [prodYield, setProdYield] = useState('');

    const fetchData = async () => {
        try {
            const [histRes, matRes, prodRes] = await Promise.all([
                axios.get(`${API_URL}/production`),
                axios.get(`${API_URL}/inventory/materials`),
                axios.get(`${API_URL}/inventory/products`)
            ]);
            setHistory(histRes.data);
            setMaterials(matRes.data);
            setProducts(prodRes.data);

            if (matRes.data.length > 0) setRawMatId(matRes.data[0].id.toString());
            if (prodRes.data.length > 0) setProdTargetId(prodRes.data[0].id.toString());
        } catch (err) {
            toast.error('Failed to load production data');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExecuteBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (Number(rawUsed) <= 0 || Number(prodYield) <= 0) {
            toast.error('Quantities must be greater than zero.');
            return;
        }

        const payload = {
            product_id: prodTargetId,
            raw_material_id: rawMatId,
            material_used: rawUsed,
            products_produced: prodYield
        };

        try {
            await axios.post(`${API_URL}/production`, payload);
            toast.success('Production Batch Executed Successfully!');
            setRawUsed('');
            setProdYield('');
            fetchData(); // Refresh history and stocks
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to execute batch');
        }
    };

    const selectedMat = materials.find(m => m.id.toString() === rawMatId);
    const estCost = selectedMat ? Number(selectedMat.cost_per_unit) * Number(rawUsed || 0) : 0;
    const autoCostUnit = Number(prodYield) > 0 ? (estCost / Number(prodYield)).toFixed(2) : '0.00';

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
                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                            <Factory size={24} />
                        </div>
                        Production Engine
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 ml-15">Advanced manufacturing & batch processing intelligence.</p>
                </div>

                <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                    <button
                        onClick={() => setActiveTab('New Batch')}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'New Batch' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        New Batch
                    </button>
                    <button
                        onClick={() => setActiveTab('History')}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'History' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        History Logs
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-poppins font-bold text-gray-800">Start Production Batch</h2>
                        <button onClick={() => toast.info('Formulas capability ready to connect')} className="text-gray-400 cursor-pointer hover:text-gray-600">
                            <Settings2 size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleExecuteBatch} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="space-y-4 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Archive size={18} className="text-blue-500" />
                                    <h3 className="font-semibold text-blue-900">Input Materials</h3>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Select Raw Material</label>
                                    <select required value={rawMatId} onChange={e => setRawMatId(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-inter shadow-sm">
                                        {materials.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} (Stock: {m.stock_quantity} {m.unit})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Quantity Used</label>
                                    <div className="relative shadow-sm rounded-xl">
                                        <input type="number" step="0.01" required value={rawUsed} onChange={e => setRawUsed(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono" placeholder="100" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">{selectedMat?.unit || 'Units'}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-blue-600 font-medium bg-blue-100/50 p-2 rounded-lg inline-block">
                                    Estimated Cost Impact: ~KSh {estCost.toLocaleString()}
                                </p>
                            </div>

                            <div className="hidden md:flex items-center justify-center -mx-4 z-10">
                                <div className="w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-400 group hover:border-emerald-200 transition-colors">
                                    <ArrowRight size={24} className="group-hover:text-emerald-500 transition-colors" />
                                </div>
                            </div>

                            <div className="space-y-4 p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Factory size={18} className="text-emerald-500" />
                                    <h3 className="font-semibold text-emerald-900">Output Product</h3>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Select Product to Produce</label>
                                    <select required value={prodTargetId} onChange={e => setProdTargetId(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-inter shadow-sm">
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Expected Yield (Quantity Produced)</label>
                                    <div className="relative shadow-sm rounded-xl">
                                        <input type="number" required value={prodYield} onChange={e => setProdYield(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono" placeholder="400" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">Units</span>
                                    </div>
                                </div>

                                <div className="bg-emerald-100 p-3 rounded-xl flex justify-between items-center border border-emerald-200">
                                    <span className="text-sm text-emerald-800 font-medium">Auto Cost/Unit</span>
                                    <span className="font-bold font-mono text-emerald-600">
                                        KSh {autoCostUnit}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 mt-6 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 hover:shadow-emerald-500/50"
                            type="submit"
                        >
                            <Plus size={20} />
                            Execute Production Batch
                        </motion.button>
                    </form>
                </motion.div>

                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-orange-900/10 relative overflow-hidden"
                    >
                        <div className="absolute top-[10%] -right-10 w-40 h-40 bg-white/20 rounded-full mix-blend-overlay filter blur-xl"></div>

                        <h3 className="font-poppins font-bold text-lg mb-4 flex items-center gap-2">
                            <History size={20} /> Recent Batches
                        </h3>

                        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                            <AnimatePresence>
                                {history.map((item) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={item.id}
                                        className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-mono font-bold bg-white/20 px-2 py-1 rounded-md">PRD-{item.id}</span>
                                            <span className="text-xs text-orange-100">{new Date(item.production_date).toISOString().split('T')[0]}</span>
                                        </div>
                                        <p className="font-medium text-sm flex items-center gap-2">
                                            {item.material_used} {item.material_unit} input <ArrowRight size={14} className="text-orange-200" /> {item.products_produced} yield
                                        </p>
                                        <p className="text-xs text-amber-200 mt-1">{item.product_name} at KSh {Number(item.cost_per_unit).toFixed(2)}</p>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {history.length === 0 && <span className="text-sm opacity-80">No batches executed yet.</span>}
                        </div>

                        <button onClick={() => setActiveTab('History')} className="w-full mt-6 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-semibold transition-all">
                            View All History Log
                        </button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
                    >
                        <h3 className="font-poppins font-bold text-gray-800 text-sm mb-4">Production Efficiency</h3>
                        <div className="h-32 flex items-end justify-between gap-2">
                            {[60, 80, 45, 90, 75, 85, 100].map((val, i) => (
                                <div key={i} className="w-full bg-gray-100 rounded-t-sm relative group overflow-hidden">
                                    <div
                                        className="absolute bottom-0 w-full bg-emerald-500 rounded-t-sm transition-all duration-1000 ease-out flex items-end justify-center pb-2"
                                        style={{ height: `${val}%` }}
                                    >
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-400 font-medium">
                            <span>Mon</span>
                            <span>Sun</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
