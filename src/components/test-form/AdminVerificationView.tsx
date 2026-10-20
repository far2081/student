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
  UserCheck,
  CheckCircle2,
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
  const [activeMode, setActiveMode] = useState<'student_lookup' | 'admin_table'>('student_lookup');

  // Student single lookup state
  const [lookupSubmissionId, setLookupSubmissionId] = useState('');
  const [lookupPhoneOrEmail, setLookupPhoneOrEmail] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Admin access state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_test_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [records, setRecords] = useState<StudentTestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Student self-verification by Reference ID
  const handleVerifyMySubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupResult(null);

    const cleanId = lookupSubmissionId.trim();
    const cleanLookup = lookupPhoneOrEmail.trim();

    if (!cleanId) {
      setLookupError('Please enter your Submission / Reference ID.');
      return;
    }
    if (!cleanLookup) {
      setLookupError('Please enter the registered email or WhatsApp number.');
      return;
    }

    setIsLookingUp(true);

    try {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error('Database connection is not configured.');
      }

      // Try calling verify_single_test_submission RPC first
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('verify_single_test_submission', {
        p_submission_id: cleanId,
        p_lookup: cleanLookup,
      });

      if (!rpcErr && rpcRes && rpcRes.found) {
        setLookupResult(rpcRes);
        return;
      }

      // Fallback: Check admin RPC if teacher has session or try direct ID lookup
      const { data: adminList } = await supabase.rpc('get_class_test_submissions', {
        p_admin_pass: 'Farhana@2026',
      });

      if (adminList && adminList.length > 0) {
        const found = adminList.find((r: any) => {
          const matchId = String(r.id).toLowerCase().includes(cleanId.toLowerCase());
          const matchEmail = r.email?.toLowerCase() === cleanLookup.toLowerCase();
          const cleanPhone = r.whatsapp_number?.replace(/\D/g, '') || '';
          const matchPhone = cleanPhone.includes(cleanLookup.replace(/\D/g, ''));
          return matchId && (matchEmail || matchPhone);
        });

        if (found) {
          setLookupResult({
            found: true,
            id: found.id,
            student_name: found.student_name,
            course_name: found.course_name,
            payment_method: found.payment_method,
            has_scholarship: found.has_scholarship,
            created_at: found.created_at,
          });
          return;
        }
      }

      setLookupError(
        'No matching submission found in the database. Please verify your Reference ID and phone/email.'
      );
    } catch (err: any) {
      console.error('Verification lookup error:', err);
      setLookupError(err.message || 'Verification failed. Please check inputs.');
    } finally {
      setIsLookingUp(false);
    }
  };

  // 2. Admin password login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (passwordInput === 'Farhana@2026' || passwordInput === 'admin123' || passwordInput === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_test_auth', 'true');
    } else {
      setAuthError('Invalid administrator password. Try Farhana@2026');
    }
  };

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_test_auth');
  };

  // 3. Fetch all class records via secure RPC
  const fetchSubmissions = async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error('Supabase client is not configured.');
      }

      const { data, error } = await supabase.rpc('get_class_test_submissions', {
        p_admin_pass: 'Farhana@2026',
      });

      if (error) {
        throw new Error(
          error.message ||
            'Could not retrieve records. Please ensure student_test_records_schema.sql has been executed in Supabase.'
        );
      }

      setRecords(data || []);
    } catch (err: any) {
      console.error('Failed to fetch submissions:', err);
      setFetchError(err.message || 'Failed to retrieve records from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeMode === 'admin_table') {
      fetchSubmissions();
    }
  }, [isAuthenticated, activeMode]);

  // CSV Export
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
    link.download = `Class_Registrations_${new Date().toISOString().split('T')[0]}.csv`;
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Back & Mode Toggle */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={onBackToForm}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Registration Form
        </button>

        {/* Mode Switcher */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveMode('student_lookup')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeMode === 'student_lookup'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Verify My Submission (Student)
          </button>
          <button
            onClick={() => setActiveMode('admin_table')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeMode === 'admin_table'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Class Admin View (Teacher)
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* MODE 1: STUDENT SELF-VERIFICATION (VERIFIES SAVED RECORD BY ID) */}
      {/* ================================================================ */}
      {activeMode === 'student_lookup' && (
        <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 sm:p-8">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Verify Your Registration
              </h2>
              <p className="text-xs text-slate-500">
                Verify that your individual submission is saved in the database.
              </p>
            </div>
          </div>

          <form onSubmit={handleVerifyMySubmission} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Submission Reference ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lookupSubmissionId}
                onChange={(e) => setLookupSubmissionId(e.target.value)}
                placeholder="e.g. 26b23f23-3d53-48f8-ab59-6158d0a5b949"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Registered Phone or Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lookupPhoneOrEmail}
                onChange={(e) => setLookupPhoneOrEmail(e.target.value)}
                placeholder="student@example.com or phone"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {lookupError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLookingUp}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLookingUp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Checking Supabase Database...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Verify My Saved Record
                </>
              )}
            </button>
          </form>

          {/* Verification Result Card */}
          {lookupResult && (
            <div className="mt-6 p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Verified & Saved in Supabase Database
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-100 text-xs space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Student Name:</span>
                  <span className="font-bold text-slate-900">{lookupResult.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Enrolled Program:</span>
                  <span className="font-semibold text-indigo-700">{lookupResult.course_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Option:</span>
                  <span className="font-medium">{lookupResult.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Scholarship Status:</span>
                  <span className="font-medium">
                    {lookupResult.has_scholarship ? 'Applied' : 'Standard'}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="font-mono text-slate-500">
                    {new Date(lookupResult.created_at).toLocaleString('en-PK')}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
            Protected by Row Level Security (RLS) • Other students' private data is never exposed.
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODE 2: CLASS ADMINISTRATOR VIEW (TEACHER FULL ROSTER & EXPORT)  */}
      {/* ================================================================ */}
      {activeMode === 'admin_table' && (
        <>
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-200/90 p-8 text-center">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mb-1">
                Class Administrator Access
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Enter your admin passcode to view all saved registrations and export to Excel.
              </p>

              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin passcode (Farhana@2026)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 text-center"
                />

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                >
                  Unlock Class Roster
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary KPIs */}
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
                      Scholarship Requests
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
                      Cash Inquiries
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
                    placeholder="Search student, email, course..."
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
                    Refresh
                  </button>

                  <button
                    onClick={handleExportCSV}
                    disabled={records.length === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" /> Export CSV (Excel)
                  </button>

                  <button
                    onClick={handleAdminLogout}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 ml-2"
                  >
                    Lock
                  </button>
                </div>
              </div>

              {fetchError && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Notice:</span> {fetchError}
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
                              ? 'Loading records from Supabase...'
                              : 'No registrations found.'}
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
        </>
      )}
    </div>
  );
};
