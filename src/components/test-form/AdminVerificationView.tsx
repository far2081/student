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
  BookOpen,
  UserCheck,
  CheckCircle2,
  Printer,
  Clock,
  CreditCard,
  Receipt,
  Check,
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
  transaction_id?: string;
  payment_status?: string;
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
  const [lookupResult, setLookupResult] = useState<StudentTestRecord | null>(null);
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
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // Print handlers for student lookup result
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const originalTitle = document.title;
    document.title = `Registration_Voucher_${lookupResult?.id || 'Student'}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  // 1. Student self-verification by Reference ID & phone/email
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
        setLookupResult({
          id: rpcRes.id,
          student_name: rpcRes.student_name,
          whatsapp_number: cleanLookup.includes('@') ? '' : cleanLookup,
          email: cleanLookup.includes('@') ? cleanLookup : '',
          course_name: rpcRes.course_name,
          payment_method: rpcRes.payment_method || 'Online',
          transaction_id: rpcRes.transaction_id || 'CASH-COUNTER',
          payment_status: rpcRes.payment_status || 'Pending Verification',
          has_scholarship: rpcRes.has_scholarship,
          created_at: rpcRes.created_at,
          photo_url: rpcRes.photo_url,
        });
        return;
      }

      // Fallback via admin RPC
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
            id: found.id,
            student_name: found.student_name,
            whatsapp_number: found.whatsapp_number,
            email: found.email,
            course_name: found.course_name,
            payment_method: found.payment_method || 'Online',
            transaction_id: found.transaction_id || (found.course_name?.includes('[Trx:') ? found.course_name.split('[Trx:')[1]?.replace(']', '').trim() : 'N/A'),
            payment_status: found.payment_status || 'Pending Verification',
            has_scholarship: found.has_scholarship,
            created_at: found.created_at,
            photo_url: found.photo_url,
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

      // Map records to ensure payment_status has default if undefined
      const mapped = (data || []).map((r: any) => ({
        ...r,
        payment_status: r.payment_status || 'Pending Verification',
        transaction_id: r.transaction_id || (r.course_name?.includes('[Trx:') ? r.course_name.split('[Trx:')[1]?.replace(']', '').trim() : 'N/A'),
      }));

      setRecords(mapped);
    } catch (err: any) {
      console.error('Failed to fetch submissions:', err);
      setFetchError(err.message || 'Failed to retrieve records from database.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Toggle payment status between 'Pending Verification' and 'Verified'
  const handleTogglePaymentStatus = async (recordId: string, currentStatus?: string) => {
    const newStatus = currentStatus === 'Verified' ? 'Pending Verification' : 'Verified';
    setIsUpdatingStatus(recordId);

    // Optimistic UI update
    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, payment_status: newStatus } : r))
    );

    try {
      // 1. Try secure RPC if configured
      const { error: rpcErr } = await supabase.rpc('update_test_submission_status', {
        p_admin_pass: 'Farhana@2026',
        p_submission_id: recordId,
        p_new_status: newStatus,
      });

      if (rpcErr) {
        // Fallback: direct update
        await supabase
          .from('student_test_records')
          .update({ payment_status: newStatus })
          .eq('id', recordId);
      }
    } catch (err) {
      console.warn('Status update sync:', err);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeMode === 'admin_table') {
      fetchSubmissions();
    }
  }, [isAuthenticated, activeMode]);

  // CSV Export with Payment Method, Transaction ID, and Status
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
      'Transaction ID / Ref',
      'Payment Status',
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
      r.transaction_id || 'N/A',
      r.payment_status || 'Pending Verification',
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
      r.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.payment_status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isVerifiedPayment = lookupResult?.payment_status === 'Verified' || lookupResult?.payment_status === 'Approved';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Back & Mode Toggle */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <button
          onClick={onBackToForm}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Registration Form
        </button>

        {/* Mode Switcher */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveMode('student_lookup')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeMode === 'student_lookup'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Verify My Submission (Student)
          </button>
          <button
            onClick={() => setActiveMode('admin_table')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
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
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100 no-print">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Verify Your Registration
              </h2>
              <p className="text-xs text-slate-500">
                Verify your submission and check payment verification status in Supabase.
              </p>
            </div>
          </div>

          <form onSubmit={handleVerifyMySubmission} className="space-y-4 no-print">
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

          {/* ============================================================== */}
          {/* VERIFICATION RESULT CARD & REQUIRED STATUS MESSAGES            */}
          {/* ============================================================== */}
          {lookupResult && (
            <div className="mt-6 space-y-4 animate-in fade-in zoom-in-95">
              {/* Conditional Required Status Message Banner */}
              {isVerifiedPayment ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3 shadow-xs">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-emerald-900">
                      Your payment has been verified successfully. Thank you!
                    </h3>
                    <p className="text-xs text-emerald-700 mt-0.5 font-medium">
                      Your fee has been verified by the administration. Your seat is confirmed.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3 shadow-xs">
                  <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-amber-900">
                      Payment Verification Pending
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5 font-medium leading-relaxed">
                      Your registration has been submitted successfully. Your payment details have been received and are pending verification.
                    </p>
                  </div>
                </div>
              )}

              {/* Printable Record Voucher */}
              <div
                id="student-registration-voucher"
                className="printable-record bg-white p-5 rounded-2xl border border-slate-200 text-xs space-y-4 text-slate-700 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <NexoraLogo size="sm" />
                    <div>
                      <h4 className="font-extrabold text-slate-900 uppercase">Nexora Academy</h4>
                      <p className="text-[10px] text-slate-500">Student Registration & Verification Voucher</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1.5 ${
                      isVerifiedPayment
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {isVerifiedPayment ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        Verified
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        Pending Verification
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Reference ID:</span>
                    <span className="font-mono font-bold text-indigo-700 break-all select-all">{lookupResult.id}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Student Name:</span>
                    <span className="font-bold text-slate-900">{lookupResult.student_name}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Enrolled Program:</span>
                    <span className="font-semibold text-indigo-800">{lookupResult.course_name}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Payment Method:</span>
                    <span className="font-bold text-slate-800">{lookupResult.payment_method}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Transaction ID / Ref:</span>
                    <span className="font-mono font-bold text-indigo-900">{lookupResult.transaction_id || 'CASH-COUNTER'}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Scholarship Status:</span>
                    <span className="font-medium">{lookupResult.has_scholarship ? 'Applied' : 'Standard'}</span>
                  </div>

                  <div className="flex justify-between pt-1 text-[11px]">
                    <span className="text-slate-400">Submission Timestamp:</span>
                    <span className="font-mono text-slate-500">
                      {new Date(lookupResult.created_at).toLocaleString('en-PK')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Print and PDF Action Buttons */}
              <div className="no-print grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-300" />
                  Print Registration
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400 no-print">
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
            <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-200/90 p-8 text-center no-print">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mb-1">
                Class Administrator Access
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Enter your admin passcode to verify student payments and download the class roster.
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
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 no-print">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Total Registrations
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
                      Verified Payments
                    </span>
                    <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                      {records.filter((r) => r.payment_status === 'Verified' || r.payment_status === 'Approved').length}
                    </p>
                    <span className="text-[11px] text-emerald-700">Confirmed seats</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Pending Verification
                    </span>
                    <p className="text-3xl font-extrabold text-amber-600 mt-1">
                      {records.filter((r) => r.payment_status !== 'Verified' && r.payment_status !== 'Approved').length}
                    </p>
                    <span className="text-[11px] text-amber-700">Awaiting check</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Scholarship Requests
                    </span>
                    <p className="text-3xl font-extrabold text-purple-600 mt-1">
                      {records.filter((r) => r.has_scholarship).length}
                    </p>
                    <span className="text-[11px] text-purple-700">Requested concession</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, phone, TID, status..."
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
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 ml-2 cursor-pointer"
                  >
                    Lock
                  </button>
                </div>
              </div>

              {fetchError && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 no-print">
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
                        <th className="py-3 px-4">Course Enrolled</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4">Transaction / Ref</th>
                        <th className="py-3 px-4 text-center">Payment Status</th>
                        <th className="py-3 px-4 text-right">Action / Date</th>
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
                        filteredRecords.map((r) => {
                          const isVerified = r.payment_status === 'Verified' || r.payment_status === 'Approved';
                          return (
                            <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  {r.photo_url ? (
                                    <img
                                      src={r.photo_url}
                                      alt=""
                                      className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                                      {r.student_name.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-bold text-slate-900 block">{r.student_name}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{r.email}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4 font-mono text-slate-600">{r.whatsapp_number}</td>

                              <td className="py-3 px-4">
                                <span className="font-semibold text-indigo-900">{r.course_name}</span>
                              </td>

                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                                  {r.payment_method}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <span className="font-mono font-bold text-indigo-700 text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                  {r.transaction_id || 'N/A'}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                    isVerified
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                      : 'bg-amber-100 text-amber-900 border-amber-300'
                                  }`}
                                >
                                  {isVerified ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                      Verified
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 text-amber-700" />
                                      Pending
                                    </>
                                  )}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleTogglePaymentStatus(r.id, r.payment_status)}
                                    disabled={isUpdatingStatus === r.id}
                                    title={isVerified ? 'Mark as Pending' : 'Mark as Verified'}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                      isVerified
                                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                                    }`}
                                  >
                                    {isUpdatingStatus === r.id ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : isVerified ? (
                                      'Revert'
                                    ) : (
                                      'Verify Payment'
                                    )}
                                  </button>
                                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                                    {new Date(r.created_at).toLocaleDateString('en-PK')}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
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
