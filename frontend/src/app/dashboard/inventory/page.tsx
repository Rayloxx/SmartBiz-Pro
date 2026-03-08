'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Search, Plus, Edit, Trash2, ArrowUpDown, AlertCircle, X } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function InventoryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [inventory, setInventory] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [formName, setFormName] = useState('');
    const [formSku, setFormSku] = useState('');
    const [formCat, setFormCat] = useState('Dairy');
    const [formPrice, setFormPrice] = useState(0);
    const [formCost, setFormCost] = useState(0);
    const [formStock, setFormStock] = useState(0);

    const fetchInventory = async () => {
        try {
            const res = await axios.get(`${API_URL}/inventory/products`);
            setInventory(res.data);
            setIsLoading(false);
        } catch (err) {
            toast.error('Failed to load inventory');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const filteredInventory = inventory.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: number) => {
        try {
            await axios.delete(`${API_URL}/inventory/products/${id}`);
            setInventory(inventory.filter(i => i.id !== id));
            toast.success('Product deleted from inventory');
        } catch (err) {
            toast.error('Failed to delete product');
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName || !formSku) return;

        const payload = {
            name: formName,
            sku: formSku,
            category: formCat,
            price: formPrice,
            cost: formCost,
            stock_quantity: formStock
        };

        try {
            const res = await axios.post(`${API_URL}/inventory/products`, payload);
            setInventory([res.data, ...inventory]);
            toast.success(`${formName} added to inventory successfully!`);
            setIsModalOpen(false);

            // Reset form
            setFormName(''); setFormSku(''); setFormCat('Dairy');
            setFormPrice(0); setFormCost(0); setFormStock(0);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to add product');
        }
    };

    return (
        <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-8 font-inter relative">
            <Toaster position="top-center" richColors />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
            >
                <div>
                    <h1 className="text-3xl font-poppins font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                            <Box size={24} />
                        </div>
                        Finished Inventory
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 ml-15">Manage your retail-ready catalog and stock levels.</p>
                </div>

                <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl font-semibold shadow-md transition-colors"
                    >
                        <Plus size={18} /> Add Product
                    </button>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/30">
                    <div className="flex gap-4">
                        <div className="bg-white border border-blue-100 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
                            <div className="bg-blue-50 p-2 rounded-xl">
                                <Box size={20} className="text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs text-blue-800 font-semibold uppercase tracking-wider">Total Value</p>
                                <p className="font-mono text-xl font-bold text-blue-900">
                                    KSh {inventory.reduce((acc, i) => acc + (Number(i.price) * i.stock_quantity), 0).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white border border-red-100 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
                            <div className="bg-red-50 p-2 rounded-xl">
                                <AlertCircle size={20} className="text-red-500" />
                            </div>
                            <div>
                                <p className="text-xs text-red-800 font-semibold uppercase tracking-wider">Low Stock</p>
                                <p className="font-mono text-xl font-bold text-red-900">{inventory.filter(i => i.stock_quantity <= 20).length} Items</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search catalog..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all text-sm font-medium"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12 text-gray-500">Loading inventory from database...</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-semibold cursor-pointer hover:text-blue-600 flex items-center gap-1">Product Details <ArrowUpDown size={12} /></th>
                                    <th className="p-4 font-semibold">SKU</th>
                                    <th className="p-4 font-semibold">Category</th>
                                    <th className="p-4 font-semibold">Cost</th>
                                    <th className="p-4 font-semibold">Retail Price</th>
                                    <th className="p-4 font-semibold text-center">Stock</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <AnimatePresence>
                                    {filteredInventory.map((item, i) => (
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ delay: i * 0.05 }}
                                            key={item.id}
                                            className="hover:bg-blue-50/20 transition-colors"
                                        >
                                            <td className="p-4 font-semibold text-gray-800 text-sm">
                                                {item.name}
                                            </td>
                                            <td className="p-4">
                                                <span className="font-mono text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded w-fit border border-gray-200 shadow-sm">{item.sku}</span>
                                            </td>
                                            <td className="p-4 text-sm font-medium text-gray-600">{item.category}</td>
                                            <td className="p-4 text-sm font-mono text-gray-500">KSh {Number(item.cost).toLocaleString()}</td>
                                            <td className="p-4 font-mono font-bold text-blue-600">KSh {Number(item.price).toLocaleString()}</td>
                                            <td className="p-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={`font-mono text-lg font-bold ${item.stock_quantity <= 20 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                        {item.stock_quantity}
                                                    </span>
                                                    {item.stock_quantity <= 20 && (
                                                        <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full mt-1">Low Stock</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 h-full">
                                                <div className="flex items-center justify-end gap-2 text-gray-400">
                                                    <button onClick={() => toast.info('Edit mode coming soon...')} className="p-2 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-colors"><Edit size={16} /></button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                    {!isLoading && filteredInventory.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            No products found. Start by adding one.
                        </div>
                    )}
                </div>
            </motion.div >

            <AnimatePresence>
                {isModalOpen && (
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
                            className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative"
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors"
                                type="button"
                            >
                                <X size={24} />
                            </button>

                            <h2 className="text-2xl font-bold font-poppins text-gray-900 mb-6">Add New Product</h2>

                            <form onSubmit={handleAddProduct} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Product Name</label>
                                    <input required value={formName} onChange={e => setFormName(e.target.value)} type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium" placeholder="E.g. Strawberry Yoghurt 500ml" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">SKU Code</label>
                                        <input required value={formSku} onChange={e => setFormSku(e.target.value)} type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm uppercase" placeholder="YOG-500-ST" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Category</label>
                                        <select value={formCat} onChange={e => setFormCat(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium select-none cursor-pointer">
                                            <option>Dairy</option>
                                            <option>Hardware</option>
                                            <option>Retail</option>
                                            <option>Agro-processing</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Cost Price (KSh)</label>
                                        <input required value={formCost} onChange={e => setFormCost(Number(e.target.value))} type="number" min="0" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Retail Price (KSh)</label>
                                        <input required value={formPrice} onChange={e => setFormPrice(Number(e.target.value))} type="number" min="0" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Initial Stock Quantity</label>
                                    <input required value={formStock} onChange={e => setFormStock(Number(e.target.value))} type="number" min="0" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm" />
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="w-full py-4 mt-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2 hover:shadow-blue-500/50 transition-all"
                                >
                                    Save Product to Catalog
                                </motion.button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
