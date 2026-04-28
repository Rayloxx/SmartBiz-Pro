'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { TrendingUp, Lock, User, UserPlus } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const res = await axios.post(`${API_URL}/auth/login`, { username, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        toast.success("Logged in successfully!");
        router.push('/dashboard');
      } else {
        // Register
        await axios.post(`${API_URL}/auth/register`, { username, password, role: 'owner', business_name: businessName });
        toast.success("Account created! Please sign in.");
        setIsLogin(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-dark)] via-[var(--color-secondary)] to-[var(--color-text-light)] animate-gradient flex items-center justify-center">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[var(--color-primary)] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[var(--color-accent)] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-[var(--color-secondary)] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      <Toaster position="top-center" richColors />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-8 sm:p-10 glass-card rounded-3xl shadow-2xl mx-4"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
            <TrendingUp size={32} className="text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold font-poppins text-center text-white mb-2 tracking-tight">
          SmartBiz Pro
        </h1>
        <p className="text-center text-white/80 text-sm mb-8 font-inter">
          Financial & Inventory Intelligence
        </p>

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-2">
            <label className="text-white/90 text-sm font-medium ml-1">Username / Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-white/50" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-white/20 transition-all font-inter"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-white/90 text-sm font-medium ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-white/50" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-white/20 transition-all font-inter"
                placeholder="••••••••"
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-white/90 text-sm font-medium ml-1">Business Name (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <TrendingUp size={18} className="text-white/50" />
                </div>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-white/20 transition-all font-inter"
                  placeholder="My Startup Ltd"
                />
              </div>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)" }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50"
            type="submit"
          >
            {isLoading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            type="button"
            className="text-white/80 hover:text-white text-sm transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
