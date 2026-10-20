import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { NexoraLogo } from '../common/NexoraLogo';

interface AdminLoginProps {
  onBackToPublic: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToPublic }) => {
  const { adminLogin, isSupabaseLive } = useApp();

  const [email, setEmail] = useState('farzunmir@gmail.com');
  const [password, setPassword] = useState('Farhana@2026');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await adminLogin(email, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to authenticate administrator.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
      {/* Return to Public Form Button */}
      <div className="w-full max-w-md mb-6">
        <button
          onClick={onBackToPublic}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Student Admission Portal
        </button>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-8 sm:p-10 relative overflow-hidden">
        {/* Top Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-slate-800" />

        {/* Logo & Header */}
        <div className="text-center mb-8">
          <NexoraLogo size="md" className="mx-auto mb-4" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Secure Admin Workspace
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Administrator Sign In
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access admissions control, scholarship approvals & cash collection registers.
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Administrator Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farzunmir@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Connection status indicator */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Database Backend:</span>
            <span
              className={`inline-flex items-center gap-1 font-bold ${
                isSupabaseLive ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              {isSupabaseLive ? 'Supabase Live Connected' : 'Local Persistent Storage'}
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                Sign In to Admin Workspace
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-[11px] text-slate-400">
          Protected by Row Level Security (RLS) & Session Token Verification.
        </div>
      </div>
    </div>
  );
};
