'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Search, Truck, Edit, Scale, Activity, X, Plus } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';

export default function MaterialsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [materials, setMaterials] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Delivery Form State
    const [matId, setMatId] = useState('');
    const [vendor, setVendor] = useState('');
    const [quantity, setQuantity] = useState('');

    // Add/Edit Material Form State
    const [editId, setEditId] = useState('');
    const [newName, setNewName] = useState('');
    const [newUnit, setNewUnit] = useState('Liters');
    const [newCost, setNewCost] = useState('');
    const [newReorder, setNewReorder] = useState('');

    const fetchMaterials = async () => {
        try {
            const res = await axios.get(`${API_URL}/inventory/materials`);
            setMaterials(res.data);
            if (res.data.length > 0 && !matId) setMatId(res.data[0].id.toString());
            setIsLoading(false);
        } catch (err) {
            toast.error('Failed to load raw materials');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const filtered = materials.filter(m =>
        m.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleLogDelivery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quantity || Number(quantity) <= 0) return;

        try {
            await axios.put(`${API_URL}/inventory/materials/${matId}/delivery`, {
                quantity_added: quantity,
                supplier: vendor
            });
            toast.success(`Successfully recorded delivery!`);
            fetchMaterials(); // refresh stock
            setIsModalOpen(false);
            setVendor('');
            setQuantity('');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update delivery');
        }
    };

    const handleEditClick = (item: any) => {
        setEditId(item.id.toString());
        setNewName(item.name);
        setNewUnit(item.unit);
        setNewCost(item.cost_per_unit || '0');
        setNewReorder(item.reorder_level || '0');
        setIsAddModalOpen(true);
    };

    const handleAddMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: newName,
                unit: newUnit,
                cost_per_unit: newCost || 0,
                reorder_level: newReorder || 0,
                stock_quantity: 0 // Default for POST
            };

            if (editId) {
                const existing = materials.find(m => m.id.toString() === editId);
                payload.stock_quantity = existing ? existing.stock_quantity : 0;
                await axios.put(`${API_URL}/inventory/materials/${editId}`, payload);
                toast.success('Material details updated successfully.');
            } else {
                await axios.post(`${API_URL}/inventory/materials`, payload);
                toast.success('New raw material added.');
            }
            
            fetchMaterials();
            setIsAddModalOpen(false);
            setEditId(''); setNewName(''); setNewCost(''); setNewReorder(''); setNewUnit('Liters');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save material');
        }
    };

    const totalValue = materials.reduce((acc, item) => acc + (Number(item.stock_quantity) * Number(item.cost_per_unit)), 0);
    const lowItems = materials.filter(item => Number(item.stock_quantity) < Number(item.reorder_level)).length;

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
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
                            <Layers size={24} />
                        </div>
                        Raw Materials Tracker
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 ml-15">Manage your inputs, supply chains, and procurement volume.</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => { setEditId(''); setNewName(''); setNewCost(''); setNewReorder(''); setNewUnit('Liters'); setIsAddModalOpen(true); }}
                        className="flex items-center gap-2 px-5 py-3 bg-white border border-indigo-200 text-indigo-600 rounded-xl font-semibold shadow-sm hover:bg-indigo-50 transition-all hover:-translate-y-0.5"
                    >
                        <Plus size={20} />
                        Add Material
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5"
                    >
                        <Truck size={20} />
                        Log Delivery
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100 shadow-sm flex flex-col justify-center">
                    <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center mb-4 shadow"><Scale size={20} /></div>
                    <h3 className="text-gray-500 font-medium text-sm border-b border-indigo-100/50 pb-1 mb-2">Total Material Value</h3>
                    <p className="text-3xl font-bold font-mono text-indigo-900">KSh {totalValue.toLocaleString()}</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-3xl border border-red-100 shadow-sm flex flex-col justify-center">
                    <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center mb-4 shadow"><Activity size={20} /></div>
                    <h3 className="text-gray-500 font-medium text-sm border-b border-red-100/50 pb-1 mb-2">Action Needed</h3>
                    <p className="text-3xl font-bold font-mono text-red-900">{lowItems} Items Low</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center">
                    <h3 className="text-gray-500 font-medium text-sm mb-2">Search Catalog</h3>
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                        />
                    </div>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
            >
                <div className="overflow-x-auto min-h-[300px]">
                    {isLoading ? (
                        <div className="text-center p-10 text-gray-500">Loading raw materials...</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-semibold">Material</th>
                                    <th className="p-4 font-semibold">Unit Cost</th>
                                    <th className="p-4 font-semibold text-center">Current Stock</th>
                                    <th className="p-4 font-semibold">Status / Threshold</th>
                                    <th className="p-4 font-semibold text-right">Edit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <AnimatePresence>
                                    {filtered.map((item, i) => {
                                        const isCrit = Number(item.stock_quantity) < Number(item.reorder_level);
                                        return (
                                            <motion.tr
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ delay: Math.min(i * 0.05, 0.3) }}
                                                key={item.id}
                                                className="hover:bg-indigo-50/20 transition-colors group"
                                            >
                                                <td className="p-4">
                                                    <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                                                </td>
                                                <td className="p-4 text-sm font-mono text-gray-500 font-bold">KSh {Number(item.cost_per_unit).toLocaleString()} <span className="text-xs text-gray-400 font-sans font-medium hover:text-indigo-600 transition-colors">/{item.unit}</span></td>
                                                <td className="p-4 text-center">
                                                    <span className={`font-mono text-xl font-black ${isCrit ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>
                                                        {Number(item.stock_quantity).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${isCrit ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 shadow-sm shadow-emerald-400/50'}`}></div>
                                                        <span className="text-xs font-medium text-gray-500">
                                                            {isCrit ? 'Below Reorder' : 'Sufficient'}
                                                            <span className="text-gray-300 ml-1">(Min {item.reorder_level})</span>
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-end">
                                                        <button onClick={() => handleEditClick(item)} className="p-2 text-gray-300 hover:text-indigo-600 group-hover:bg-indigo-50 rounded-lg transition-colors"><Edit size={16} /></button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                    {!isLoading && filtered.length === 0 && <div className="p-6 text-center text-gray-400">No materials track. Please add one.</div>}
                </div>
            </motion.div>


            {/* Add Material Modal */}
            <AnimatePresence>
                {
                    isAddModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative"
                            >
                                <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors" type="button"><X size={24} /></button>
                                <h2 className="text-2xl font-bold font-poppins text-gray-900 mb-6 flex items-center gap-2">{editId ? 'Edit Raw Material' : 'New Raw Material'}</h2>
                                <form onSubmit={handleAddMaterial} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Name</label>
                                        <input required value={newName} onChange={e => setNewName(e.target.value)} type="text" className="w-full p-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500" placeholder="E.g. Raw Milk" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Measurement Unit</label>
                                        <select value={newUnit} onChange={e => setNewUnit(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500">
                                            <option>Liters</option><option>Kg</option><option>Pieces</option><option>Packs</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Cost Per Unit</label>
                                        <input required value={newCost} onChange={e => setNewCost(e.target.value)} type="number" step="0.01" className="w-full p-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Minimum Reorder Level</label>
                                        <input required value={newReorder} onChange={e => setNewReorder(e.target.value)} type="number" className="w-full p-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono" />
                                    </div>
                                    <motion.button whileTap={{ scale: 0.98 }} type="submit" className="w-full py-4 mt-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">
                                        {editId ? 'Save Changes' : 'Save Material'}
                                    </motion.button>
                                </form>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Log Delivery Modal Overlay */}
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

                                <h2 className="text-2xl font-bold font-poppins text-gray-900 mb-6 flex items-center gap-2">
                                    <Truck className="text-indigo-500" /> Procurement Log
                                </h2>

                                <form onSubmit={handleLogDelivery} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Material Received</label>
                                        <select required value={matId} onChange={e => setMatId(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium select-none cursor-pointer">
                                            {materials.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Vendor / Supplier (Optional)</label>
                                        <input value={vendor} onChange={e => setVendor(e.target.value)} type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium" placeholder="E.g. Kiplagat Farms Delivery Team" />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Quantity Arrived</label>
                                        <div className="relative">
                                            <input required value={quantity} onChange={e => setQuantity(e.target.value)} type="number" min="1" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-lg font-bold" placeholder="500" />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">Units</span>
                                        </div>
                                    </div>

                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        className="w-full py-4 mt-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex justify-center items-center gap-2 hover:shadow-indigo-500/50 transition-all"
                                    >
                                        <Plus size={20} />
                                        Update Stock Levels
                                    </motion.button>
                                </form>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    );
}
