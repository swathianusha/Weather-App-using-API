/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Lock, User, AlertCircle, Loader2 } from "lucide-react";
import { useApp } from "../context/AppContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) {
          throw new Error("Please enter your name");
        }
        await register(name, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "An authentication error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md" id="auth-overlay">
        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md p-6 rounded-3xl bg-[#0d1424]/90 backdrop-blur-2xl border border-white/20 shadow-2xl text-white"
          id="auth-modal-card"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            id="auth-close-btn"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-display font-black tracking-tight text-white">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-xs text-white/60 mt-1 font-mono">
              {isLogin ? "Sign in to save favorite cities & history" : "Unlock synchronization & cloud weather insights"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-xs text-red-200 font-bold font-mono">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-white/60 uppercase tracking-[0.15em] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                    id="auth-input-name"
                  />
                  <User className="absolute left-3.5 top-3 text-white/40" size={16} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-[0.15em] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  id="auth-input-email"
                />
                <Mail className="absolute left-3.5 top-3 text-white/40" size={16} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-[0.15em] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  id="auth-input-password"
                />
                <Lock className="absolute left-3.5 top-3 text-white/40" size={16} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-white text-slate-950 font-bold active:scale-98 hover:bg-white/90 transition-all flex items-center justify-center gap-2"
              id="auth-submit-btn"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Toggle link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-xs text-[#fdbb2d] hover:underline font-bold tracking-wide font-mono"
              id="auth-toggle-mode-btn"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
