import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AdmissionForm } from './components/admission/AdmissionForm';
import { ApplicationStatusCheck } from './components/status/ApplicationStatusCheck';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { NexoraLogo } from './components/common/NexoraLogo';
import {
  GraduationCap,
  Search,
  ShieldCheck,
  ExternalLink,
  Mail,
  Heart,
  Globe,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { isAdminLoggedIn, adminLogout } = useApp();

  const [currentView, setCurrentView] = useState<'apply' | 'status' | 'admin'>('apply');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Global Public Navigation Header (Hidden in Admin Dashboard to give clean workspace) */}
      {currentView !== 'admin' && (
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 no-print shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            {/* Logo */}
            <div
              onClick={() => setCurrentView('apply')}
              className="cursor-pointer flex items-center gap-3"
            >
              <NexoraLogo size="md" showSubtitle />
            </div>

            {/* Nav Links */}
            <nav className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setCurrentView('apply')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  currentView === 'apply'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100/70'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Apply for Admission</span>
              </button>

              <button
                onClick={() => setCurrentView('status')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  currentView === 'status'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100/70'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Track Status</span>
              </button>

              <button
                onClick={() => setCurrentView('admin')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Admin Workspace</span>
                <span className="sm:hidden">Admin</span>
              </button>
            </nav>
          </div>
        </header>
      )}

      {/* Main View Container */}
      <div className="flex-1">
        {currentView === 'apply' && (
          <AdmissionForm onCheckStatusClick={() => setCurrentView('status')} />
        )}

        {currentView === 'status' && (
          <ApplicationStatusCheck onBackToForm={() => setCurrentView('apply')} />
        )}

        {currentView === 'admin' && (
          <>
            {isAdminLoggedIn ? (
              <AdminDashboard
                onLogout={adminLogout}
                onGoToPublicForm={() => setCurrentView('apply')}
              />
            ) : (
              <AdminLogin onBackToPublic={() => setCurrentView('apply')} />
            )}
          </>
        )}
      </div>

      {/* Exact Required Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <NexoraLogo size="sm" className="brightness-200 contrast-200" />
          </div>

          <div className="text-sm font-medium text-slate-300">
            <p className="font-bold text-white text-base">Created by farhana Aamir</p>
            <p className="mt-1">
              <a
                href="mailto:farzunmir@gmail.com"
                className="text-indigo-400 hover:text-indigo-300 transition-colors underline font-mono text-xs"
              >
                farzunmir@gmail.com
              </a>
            </p>
          </div>

          <p className="text-[11px] text-slate-500 pt-3 border-t border-slate-800/80">
            © {new Date().getFullYear()} Nexora Academy • Student Admission & Fee Management Portal • Official Academic Registry
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
