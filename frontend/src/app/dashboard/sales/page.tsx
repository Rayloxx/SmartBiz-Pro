'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, CheckCircle, CreditCard, Banknote, Search, Tag, Filter, Minus, Plus, Printer, X } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';

const categories = ['All', 'Dairy', 'Hardware', 'Retail', 'Agro-processing', 'Other'];

interface CartItem {
    product: any;
    quantity: number;
}

export default function SalesPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showMpesaModal, setShowMpesaModal] = useState(false);
    const [mpesaPhone, setMpesaPhone] = useState('');
    const [lastSale, setLastSale] = useState<any>(null);

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${API_URL}/inventory/products`);
            setProducts(res.data);
            setIsLoading(false);
        } catch (err) {
            toast.error('Failed to load product catalog');
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const filteredProducts = products.filter(p => {
        if (!p) return false;
        const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const addToCart = (product: any) => {
        if (product.stock_quantity <= 0) {
            toast.error(`${product.name} is out of stock!`);
            return;
        }
        const existing = cart.find(item => item.product.id === product.id);
        if (existing) {
            if (existing.quantity >= product.stock_quantity) {
                toast.error('Cannot exceed available stock!');
                return;
            }
            setCart(cart.map(item =>
                item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { product, quantity: 1 }]);
            toast.success(`${product.name} added`, { duration: 1000 });
        }
    };

    const decreaseQty = (id: number) => {
        setCart(cart.map(item => {
            if (item.product.id === id) {
                return item.quantity <= 1 ? null : { ...item, quantity: item.quantity - 1 };
            }
            return item;
        }).filter(Boolean) as CartItem[]);
    };

    const removeFromCart = (id: number) => {
        setCart(cart.filter(item => item.product.id !== id));
    };

    const [isAwaitingPayment, setIsAwaitingPayment] = useState(false);
    const [currentTransactionId, setCurrentTransactionId] = useState<number | null>(null);

    const handleCheckout = async (method: string) => {
        if (cart.length === 0 || isCheckingOut) return;
        
        if (method === 'M-Pesa') {
            setShowMpesaModal(true);
            return;
        }

        await processSale(method);
    };

    const confirmMpesaSale = async () => {
        if (!mpesaPhone) {
            toast.error('Please enter a phone number');
            return;
        }
        setShowMpesaModal(false);
        await processSale('M-Pesa', mpesaPhone);
    };

    const pollForPaymentStatus = async (txId: number) => {
        let attempts = 0;
        const maxAttempts = 60; // 3 minutes total (3s * 60)
        
        const interval = setInterval(async () => {
            attempts++;
            if (attempts > maxAttempts) {
                clearInterval(interval);
                setIsAwaitingPayment(false);
                toast.error('Payment timeout. Please check your M-Pesa statement.');
                return;
            }

            try {
                const res = await axios.get(`${API_URL}/sales/status/${txId}`);
                if (res.data.status === 'PAID') {
                    clearInterval(interval);
                    setIsAwaitingPayment(false);
                    const saleInfo = {
                        items: [...cart],
                        method: 'M-Pesa',
                        total: res.data.total_amount,
                        time: new Date().toLocaleString(),
                        id: res.data.id,
                        mpesa_code: res.data.mpesa_code
                    };
                    setLastSale(saleInfo);
                    setCart([]);
                    fetchProducts();
                    setShowReceipt(true);
                    toast.success(`✅ Payment Confirmed! Transaction ${res.data.mpesa_code}`);
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        }, 3000);
    };

    const processSale = async (method: string, phone?: string) => {
        setIsCheckingOut(true);
        const payload = {
            payment_method: method,
            phone_number: phone,
            items: cart.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity
            }))
        };

        try {
            const res = await axios.post(`${API_URL}/sales`, payload);
            
            if (method === 'M-Pesa' && res.data.status === 'AWAITING_PAYMENT') {
                setCurrentTransactionId(res.data.transaction_id);
                setIsAwaitingPayment(true);
                pollForPaymentStatus(res.data.transaction_id);
                toast.info('Waiting for customer to pay...');
            } else {
                const saleInfo = {
                    items: [...cart],
                    method,
                    total: res.data.total,
                    time: new Date().toLocaleString(),
                    id: res.data.transaction_id || Date.now()
                };
                setLastSale(saleInfo);
                setCart([]);
                fetchProducts();
                setShowReceipt(true);
                toast.success(`✅ Transaction complete!`);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to process transaction');
        } finally {
            setIsCheckingOut(false);
        }
    };

    const subtotal = cart.reduce((acc, item) => acc + (Number(item.product.price) * item.quantity), 0);
    const vat = subtotal * 0.16;
    const total = subtotal + vat;

    const getCatColor = (cat: string) => {
        const map: Record<string, string> = {
            'Dairy': 'blue', 'Retail': 'emerald', 'Hardware': 'slate', 'Agro-processing': 'green'
        };
        return map[cat] || 'purple';
    };

    return (
        <div className="p-4 lg:p-6 max-w-[1600px] mx-auto font-inter h-[calc(100vh-0px)] flex flex-col gap-4">
            <Toaster position="top-center" richColors />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex-shrink-0"
            >
                <div>
                    <h1 className="text-2xl font-poppins font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                            <ShoppingCart size={20} />
                        </div>
                        Point of Sale
                    </h1>
                    <p className="text-gray-500 text-xs mt-1 ml-13">Fast checkout for {products.length} products • {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm font-medium"
                    />
                </div>
            </motion.div>

            {/* Main Layout */}
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-0">
                {/* Product Grid */}
                <div className="xl:col-span-2 flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Category Tabs */}
                    <div className="flex gap-2 overflow-x-auto p-4 pb-3 flex-shrink-0 custom-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs whitespace-nowrap transition-all ${activeCategory === cat
                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                                    }`}
                            >
                                {cat === 'All' ? <Filter size={13} /> : <Tag size={13} />}
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Products */}
                    <div className="overflow-y-auto flex-1 px-4 pb-4 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-3" />
                                    <p className="text-sm">Loading catalog...</p>
                                </div>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                No products found for "{searchTerm || activeCategory}"
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                                <AnimatePresence>
                                    {filteredProducts.map((product) => {
                                        const inCart = cart.find(i => i.product.id === product.id);
                                        const isOOS = product.stock_quantity <= 0;
                                        return (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.15 }}
                                                key={product.id}
                                                whileHover={{ y: -3, boxShadow: isOOS ? 'none' : '0 8px 20px -5px rgba(16, 185, 129, 0.2)' }}
                                                whileTap={{ scale: isOOS ? 1 : 0.96 }}
                                                onClick={() => !isOOS && addToCart(product)}
                                                className={`relative flex flex-col rounded-2xl border p-4 h-40 transition-all select-none ${isOOS
                                                    ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                                                    : 'cursor-pointer bg-white border-gray-100 hover:border-emerald-200'
                                                    } ${inCart ? 'ring-2 ring-emerald-400 border-emerald-200' : ''}`}
                                            >
                                                {/* Stock badge */}
                                                <div className="absolute top-3 right-3">
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${isOOS ? 'bg-red-50 text-red-600 border-red-100' : inCart ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                                        {isOOS ? 'OUT' : inCart ? `×${inCart.quantity}` : `${product.stock_quantity}`}
                                                    </span>
                                                </div>

                                                <div className="flex-1 pt-1">
                                                    <h3 className="font-poppins font-semibold text-gray-800 text-sm leading-tight pr-8">{product.name}</h3>
                                                    <p className={`text-[10px] font-bold mt-1.5 uppercase tracking-wider text-${getCatColor(product.category)}-500`}>{product.category}</p>
                                                </div>

                                                <div className="flex justify-between items-end pt-2 border-t border-gray-50">
                                                    <p className="text-base font-bold font-mono text-emerald-600">KSh {Number(product.price).toLocaleString()}</p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cart Panel */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col h-full overflow-hidden"
                >
                    {/* Cart Header */}
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                        <h2 className="text-lg font-poppins font-bold text-gray-800">Current Sale</h2>
                        <div className="flex items-center gap-2">
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                                {cart.reduce((a, b) => a + b.quantity, 0)} items
                            </span>
                            {cart.length > 0 && (
                                <button onClick={() => setCart([])} className="text-gray-400 hover:text-red-500 transition-colors text-xs font-medium">
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-3">
                                <ShoppingCart size={48} className="text-gray-200" />
                                <p className="text-sm font-medium">Click products to add</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {cart.map((item) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -15 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        key={item.product.id}
                                        className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm gap-2"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm text-gray-800 leading-tight truncate">{item.product.name}</h4>
                                            <p className="text-xs text-gray-400 font-mono mt-0.5">KSh {Number(item.product.price).toLocaleString()} ea.</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => decreaseQty(item.product.id)} className="w-6 h-6 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors">
                                                <Minus size={12} />
                                            </button>
                                            <span className="w-6 text-center text-sm font-bold text-gray-800 font-mono">{item.quantity}</span>
                                            <button onClick={() => addToCart(item.product)} className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center justify-center transition-colors">
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="font-bold font-mono text-gray-900 text-sm">KSh {(Number(item.product.price) * item.quantity).toLocaleString()}</span>
                                            <button onClick={() => removeFromCart(item.product.id)} className="text-[10px] text-red-400 hover:text-red-600 font-medium transition-colors">
                                                Remove
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>

                    {/* Checkout Panel */}
                    <div className="p-5 bg-gray-900 text-white flex-shrink-0">
                        <div className="space-y-1.5 mb-4">
                            <div className="flex justify-between text-gray-400 text-sm">
                                <span>Subtotal</span>
                                <span className="font-mono">KSh {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-400 text-sm">
                                <span>VAT (16%)</span>
                                <span className="font-mono">KSh {vat.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-gray-700 pt-2 flex justify-between items-end">
                                <span className="text-gray-200 font-medium text-sm">Total Payable</span>
                                <span className="text-2xl font-bold font-mono text-emerald-400">KSh {total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2.5">
                            <button
                                onClick={() => handleCheckout('M-Pesa')}
                                disabled={cart.length === 0 || isCheckingOut}
                                className="flex justify-center items-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors"
                            >
                                <CreditCard size={15} /> M-Pesa
                            </button>
                            <button
                                onClick={() => handleCheckout('Cash')}
                                disabled={cart.length === 0 || isCheckingOut}
                                className="flex justify-center items-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-bold transition-colors"
                            >
                                <Banknote size={15} /> Cash
                            </button>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleCheckout('Mixed')}
                            disabled={cart.length === 0 || isCheckingOut}
                            className="w-full py-3.5 bg-gradient-to-r from-emerald-400 to-emerald-600 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-bold text-base shadow-lg flex justify-center items-center gap-2 hover:shadow-emerald-500/25 transition-all"
                        >
                            {isCheckingOut ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <CheckCircle size={18} />
                            )}
                            {isCheckingOut ? 'Processing...' : 'Complete Transaction'}
                        </motion.button>
                    </div>
                </motion.div>
            </div>

            {/* M-Pesa Phone Modal */}
            <AnimatePresence>
                {showMpesaModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative border border-gray-100"
                        >
                            <h3 className="text-xl font-poppins font-bold text-gray-900 mb-2">M-Pesa Checkout</h3>
                            <p className="text-gray-500 text-sm mb-6">Enter the customer's phone number to trigger the STK Push.</p>
                            
                            <div className="space-y-4 mb-8">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Phone Number</label>
                                    <input 
                                        type="text" 
                                        placeholder="07XXXXXXXX" 
                                        value={mpesaPhone}
                                        onChange={(e) => setMpesaPhone(e.target.value)}
                                        autoFocus
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-lg tracking-widest"
                                    />
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-xl flex items-center gap-3">
                                    <Banknote size={20} className="text-emerald-600" />
                                    <div>
                                        <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-tighter">Amount Due</p>
                                        <p className="text-lg font-bold text-emerald-600 font-mono">KSh {total.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowMpesaModal(false)}
                                    className="flex-1 py-3 text-gray-400 hover:text-gray-600 text-sm font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmMpesaSale}
                                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all"
                                >
                                    Pay Now
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* M-PESA Real-time Payment Status Modal */}
            <AnimatePresence>
                {isAwaitingPayment && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl relative text-center border border-gray-100"
                        >
                            <div className="relative mb-8">
                                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto relative z-10">
                                    <CreditCard size={48} className="text-green-600 animate-pulse" />
                                </div>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                            </div>
                            
                            <h3 className="text-2xl font-poppins font-bold text-gray-900 mb-2">Waiting for Payment</h3>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">Please ask the customer to pay <span className="font-bold text-gray-900">KSh {total.toFixed(2)}</span> to your Till/Paybill number.</p>
                            
                            <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-700 font-bold text-xs shrink-0">1</div>
                                    <p className="text-xs text-gray-600">Payment detected automatically</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-700 font-bold text-xs shrink-0">2</div>
                                    <p className="text-xs text-gray-600">Stock updated instantly upon confirmation</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsAwaitingPayment(false)}
                                className="w-full py-4 text-gray-400 hover:text-gray-600 text-sm font-semibold transition-colors"
                            >
                                Cancel Order
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Receipt Modal */}
            <AnimatePresence>
                {showReceipt && lastSale && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl"
                            id="receipt"
                        >
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={28} className="text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-poppins font-bold text-gray-900">Sale Complete!</h3>
                                <p className="text-gray-500 text-sm mt-1">Payment via {lastSale.method}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{lastSale.time}</p>
                            </div>

                                <div className="bg-gray-50 rounded-2xl p-4 space-y-2 mb-4 text-sm">
                                {lastSale.items.map((item: CartItem) => (
                                    <div key={item.product.id} className="flex justify-between">
                                        <span className="text-gray-700 truncate pr-2">{item.product.name} × {item.quantity}</span>
                                        <span className="font-mono font-bold text-gray-900">KSh {(Number(item.product.price) * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                                {lastSale.mpesa_code && (
                                    <div className="flex justify-between text-xs text-green-600 pt-1">
                                        <span>M-Pesa Ref</span>
                                        <span className="font-mono font-bold uppercase">{lastSale.mpesa_code}</span>
                                    </div>
                                )}
                                <div className="border-t pt-2 flex justify-between font-bold">
                                    <span>Total Paid</span>
                                    <span className="text-emerald-600 font-mono">KSh {Number(lastSale.total).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                                >
                                    <Printer size={16} /> Print
                                </button>
                                <button
                                    onClick={() => setShowReceipt(false)}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors"
                                >
                                    New Sale
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
