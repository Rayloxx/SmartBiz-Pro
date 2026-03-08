'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, CheckCircle, CreditCard, Banknote, Search, Tag, Filter } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const categories = ['All', 'Dairy', 'Hardware', 'Retail', 'Agro-processing', 'Other'];

export default function SalesPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<{ product: any, quantity: number }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [isLoading, setIsLoading] = useState(true);

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${API_URL}/inventory/products`);
            setProducts(res.data);
            setIsLoading(false);
        } catch (err) {
            toast.error('Failed to load catalog');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const filteredProducts = products.filter(p => {
        if (!p) return false;
        const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const addToCart = (product: any) => {
        if (product.stock_quantity <= 0) {
            toast.error('Item is out of stock!');
            return;
        }
        const existing = cart.find(item => item.product.id === product.id);
        if (existing) {
            if (existing.quantity >= product.stock_quantity) {
                toast.error('Cannot exceed available stock!');
                return;
            }
            setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, { product, quantity: 1 }]);
        }
    };

    const removeFromCart = (id: number) => {
        setCart(cart.filter(item => item.product.id !== id));
    };

    const handleCheckout = async (method: string) => {
        if (cart.length === 0) return;

        const payload = {
            payment_method: method,
            items: cart.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity
            }))
        };

        try {
            await axios.post(`${API_URL}/sales`, payload);
            toast.success(`Transaction Completed! Paid via ${method}`);
            setCart([]);
            fetchProducts(); // Refresh stock
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to process transaction');
        }
    };

    const subtotal = cart.reduce((acc, item) => acc + (Number(item.product.price) * item.quantity), 0);
    const vat = subtotal * 0.16;
    const total = subtotal + vat;

    const getCatColor = (cat: string) => {
        if (cat === 'Dairy') return 'blue';
        if (cat === 'Retail') return 'emerald';
        if (cat === 'Hardware') return 'slate';
        return 'purple';
    };

    return (
        <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-6 font-inter h-[calc(100vh-2rem)] flex flex-col">
            <Toaster position="top-center" richColors />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex-shrink-0"
            >
                <div>
                    <h1 className="text-3xl font-poppins font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                            <ShoppingCart size={24} />
                        </div>
                        Point of Sale
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 ml-15">Fast checkout processing for diverse products.</p>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search catalog..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm font-medium"
                    />
                </div>
            </motion.div>

            <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 min-h-0">
                <div className="xl:col-span-2 flex flex-col h-full bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <div className="flex gap-2 overflow-x-auto pb-4 mb-2 custom-scrollbar flex-shrink-0">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {cat === 'All' ? <Filter size={16} /> : <Tag size={16} />}
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-gray-400">Loading catalog...</div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                                <AnimatePresence>
                                    {filteredProducts.map((product) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                            key={product.id}
                                            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.15)" }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => addToCart(product)}
                                            className="bg-white p-4 rounded-2xl border border-gray-100 cursor-pointer group relative overflow-hidden flex flex-col h-44 shadow-sm hover:border-emerald-200"
                                        >
                                            <div className="absolute top-0 right-0 p-3">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${product.stock_quantity <= 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                                    {product.stock_quantity <= 0 ? 'OUT OF STOCK' : `${product.stock_quantity} left`}
                                                </span>
                                            </div>

                                            <div className="mt-4 flex-1">
                                                <h3 className="font-poppins font-semibold text-gray-800 text-sm leading-tight pr-8">
                                                    {product.name}
                                                </h3>
                                                <p className={`text-[10px] font-bold mt-2 uppercase tracking-wide text-${getCatColor(product.category)}-500`}>{product.category}</p>
                                            </div>

                                            <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-50">
                                                <p className="text-lg font-bold font-mono text-emerald-600">KSh {product.price}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-gray-100 flex flex-col h-full overflow-hidden"
                >
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                        <h2 className="text-xl font-poppins font-bold text-gray-800">Current Sale</h2>
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold font-mono">
                            {cart.reduce((a, b) => a + b.quantity, 0)} Items
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
                                <ShoppingCart size={64} className="text-gray-200" />
                                <p className="text-sm font-medium">Select products to add to cart</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {cart.map((item) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        key={item.product.id}
                                        className="flex justify-between items-center p-3 bg-white rounded-2xl border border-gray-100 shadow-sm"
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-sm text-gray-800 leading-tight">{item.product.name}</h4>
                                            <p className="text-xs text-gray-500 font-mono font-medium mt-1">KSh {item.product.price} x {item.quantity}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 ml-2">
                                            <span className="font-bold font-mono text-gray-900 text-sm">KSh {Number(item.product.price) * item.quantity}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <button onClick={(e) => { e.stopPropagation(); addToCart(item.product); }} className="w-6 h-6 rounded-md bg-gray-100 text-gray-600 flex items-center justify-center font-bold hover:bg-gray-200 text-xs">+</button>
                                                <button
                                                    onClick={() => removeFromCart(item.product.id)}
                                                    className="text-xs text-red-500 hover:text-red-700 font-medium px-1"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>

                    <div className="p-6 bg-gray-900 text-white flex-shrink-0">
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-gray-400 text-sm">
                                <span>Subtotal</span>
                                <span className="font-mono">KSh {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-400 text-sm">
                                <span>VAT (16%)</span>
                                <span className="font-mono">KSh {vat.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-gray-700 pt-3 flex justify-between items-end">
                                <span className="text-gray-200 font-medium">Total Payable</span>
                                <span className="text-3xl font-bold font-mono text-emerald-400">KSh {total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <button
                                onClick={() => handleCheckout('M-Pesa')}
                                disabled={cart.length === 0}
                                className="flex justify-center items-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors"
                            >
                                <CreditCard size={18} />
                                M-Pesa / Card
                            </button>
                            <button
                                onClick={() => handleCheckout('Cash')}
                                disabled={cart.length === 0}
                                className="flex justify-center items-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold transition-colors"
                            >
                                <Banknote size={18} />
                                Cash Receive
                            </button>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleCheckout('Mixed')}
                            disabled={cart.length === 0}
                            className="w-full py-4 bg-gradient-to-r from-emerald-400 to-emerald-600 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg flex justify-center items-center gap-2 hover:shadow-emerald-500/25 transition-all"
                        >
                            <CheckCircle size={20} />
                            Complete Transaction
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </div >
    );
}
