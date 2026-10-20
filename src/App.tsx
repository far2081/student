import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { StudentTestForm } from './components/test-form/StudentTestForm';
import { AdminVerificationView } from './components/test-form/AdminVerificationView';
import { NexoraLogo } from './components/common/NexoraLogo';
import { GraduationCap, ShieldCheck, ExternalLink } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'form' | 'admin'>('form');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div
            onClick={() => setCurrentView('form')}
            className="cursor-pointer flex items-center gap-2"
          >
            <NexoraLogo size="sm" showSubtitle />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('form')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'form'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Registration Form</span>
            </button>

            <button
              onClick={() => setCurrentView('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Verify Submissions</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {currentView === 'form' ? (
          <StudentTestForm onOpenAdmin={() => setCurrentView('admin')} />
        ) : (
          <AdminVerificationView onBackToForm={() => setCurrentView('form')} />
        )}
      </main>

      {/* Exact Required Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 no-print mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-3">
          <div className="flex items-center justify-center">
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
            © {new Date().getFullYear()} Nexora Academy • Student Admission & Verification System
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
