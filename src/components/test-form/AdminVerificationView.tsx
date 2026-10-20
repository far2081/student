import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { NexoraLogo } from '../common/NexoraLogo';
import {
  Users,
  ShieldCheck,
  Lock,
  Download,
  RefreshCw,
  Search,
  ArrowLeft,
  Calendar,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  BookOpen,
} from 'lucide-react';

interface StudentTestRecord {
  id: string;
  student_name: string;
  whatsapp_number: string;
  email: string;
  course_name: string;
  photo_url?: string;
  has_scholarship: boolean;
  payment_method: string;
  created_at: string;
}

interface AdminVerificationViewProps {
  onBackToForm: () => void;
}

export const AdminVerificationView: React.FC<AdminVerificationViewProps> = ({ onBackToForm }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_test_auth') === 'true';
  });

  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [records, setRecords] = useState<StudentTestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Password authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (passwordInput === 'Farhana@2026' || passwordInput === 'admin123' || passwordInput === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_test_auth', 'true');
    } else {
      setAuthError('Invalid administrator password. Try Farhana@2026');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_test_auth');
  };

  // Fetch records from Supabase
  const fetchSubmissions = async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error('Supabase client is not configured.');
      }

      // Try selecting from student_test_records directly
      const { data, error } = await supabase
        .from('student_test_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Standard select error, trying RPC:', error);
        // Try calling the secure RPC function
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          'get_class_test_submissions',
          { p_admin_pass: 'Farhana@2026' }
        );

        if (rpcError) {
          throw new Error(
            error.message || 'Could not fetch records. Please run student_test_records_schema.sql in your Supabase SQL Editor.'
          );
        }

        setRecords(rpcData || []);
      } else {
        setRecords(data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch submissions:', err);
      setFetchError(err.message || 'Failed to retrieve records from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions();
    }
  }, [isAuthenticated]);

  // Excel UTF-8 CSV Export
  const handleExportCSV = () => {
    if (records.length === 0) return;

    const BOM = '\uFEFF';
    const headers = [
      'Submission ID',
      'Student Full Name',
      'WhatsApp Number',
      'Email Address',
      'Course Name',
      'Has Scholarship',
      'Payment Method',
      'Submission Date & Time',
    ];

    const rows = records.map((r) => [
      r.id,
      r.student_name,
      r.whatsapp_number,
      r.email,
      r.course_name,
      r.has_scholarship ? 'Yes' : 'No',
      r.payment_method,
      new Date(r.created_at).toLocaleString('en-PK'),
    ]);

    const csvContent =
      BOM +
      [
        headers.map((h) => `"${h}"`).join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Class_Submissions_Export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = records.filter(
    (r) =>
      r.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.whatsapp_number?.includes(searchTerm) ||
      r.course_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBackToForm}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Student Registration Form
        </button>

        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-rose-600 hover:text-rose-800"
          >
            Sign Out
          </button>
        )}
      </div>

      {/* Password Protection Screen */}
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-200/90 p-8 sm:p-10 text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-1">
            Administrator Verification Passcode
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Enter the admin password to verify all incoming class registrations.
          </p>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              required
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter admin password (Farhana@2026)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 text-center"
            />

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              Unlock Submissions View
            </button>
          </form>
        </div>
      ) : (
        /* Authenticated Records Table & Verification Summary */
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Class Submissions
                </span>
                <p className="text-3xl font-extrabold text-indigo-600 mt-1">
                  {records.length}
                </p>
                <span className="text-[11px] text-slate-500">Live in Supabase</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Scholarship Inquiries
                </span>
                <p className="text-3xl font-extrabold text-amber-600 mt-1">
                  {records.filter((r) => r.has_scholarship).length}
                </p>
                <span className="text-[11px] text-amber-700">Requested concession</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Preferred Payment: Cash
                </span>
                <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                  {records.filter((r) => r.payment_method === 'Cash').length}
                </p>
                <span className="text-[11px] text-emerald-700">Counter payments</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search students, email, course..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={fetchSubmissions}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
                Refresh Submissions
              </button>

              <button
                onClick={handleExportCSV}
                disabled={records.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Export CSV (Excel)
              </button>
            </div>
          </div>

          {fetchError && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Database Setup Notice:</span> {fetchError}
                <p className="mt-1 text-slate-600">
                  Open your Supabase SQL editor and execute the query in <strong>student_test_records_schema.sql</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Submissions Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">WhatsApp</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Course Enrolled</th>
                    <th className="py-3 px-4 text-center">Scholarship</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4 text-right">Submission Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        {isLoading
                          ? 'Querying Supabase database...'
                          : 'No registrations submitted yet. Share the public form link with your students to begin collecting records!'}
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {r.photo_url ? (
                              <img
                                src={r.photo_url}
                                alt=""
                                className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                                {r.student_name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="font-bold text-slate-900">{r.student_name}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-600">{r.whatsapp_number}</td>

                        <td className="py-3 px-4 text-slate-600">{r.email}</td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-indigo-900">{r.course_name}</span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {r.has_scholarship ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Yes
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">No</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            {r.payment_method}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
                          {new Date(r.created_at).toLocaleString('en-PK')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
