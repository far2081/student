import React, { useState, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { NexoraLogo } from '../common/NexoraLogo';
import {
  printRegistrationDocument,
  downloadRegistrationPdf,
  RegistrationRecordData,
} from '../../utils/registrationDocument';
import {
  CheckCircle2,
  AlertCircle,
  Upload,
  User,
  Phone,
  Mail,
  BookOpen,
  Lock,
  Check,
  RefreshCw,
  Printer,
  Download,
  Building,
  Smartphone,
  Wallet,
  Banknote,
  Receipt,
  Sparkles,
  FlaskConical,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudentTestFormProps {
  onOpenAdmin: () => void;
}

export type DemoPaymentMethodType =
  | 'Cash Payment'
  | 'JazzCash (Demo)'
  | 'Easypaisa (Demo)'
  | 'Bank Transfer (Demo)';

export const SCHOLARSHIP_OPTIONS = [
  { value: 'Merit-Based', label: 'Merit-Based (High Academic Records)' },
  { value: 'Need-Based', label: 'Need-Based (Financial Hardship)' },
  { value: 'Female Empowerment', label: 'Female Empowerment in Tech' },
  { value: 'Orphan / Disability', label: 'Orphan / Special Ability' },
  { value: 'Hafiz-e-Quran', label: 'Hafiz-e-Quran' },
  { value: 'Other', label: 'Other Specific Consideration' },
];

export const DEMO_PAYMENT_CONFIG: Record<
  DemoPaymentMethodType,
  {
    name: string;
    sandboxChannel: string;
    simulatedAccount: string;
    instructions: string;
    icon: 'banknote' | 'smartphone' | 'wallet' | 'building';
  }
> = {
  'Cash Payment': {
    name: 'Cash Payment',
    sandboxChannel: 'Campus Admission Desk / On-Site Cash Counter',
    simulatedAccount: 'Nexora Academy Accounts Desk (Demo Cash Voucher)',
    instructions:
      'Simulate an on-site cash counter payment. A demo counter deposit receipt reference is generated without requiring any real cash or gateway.',
    icon: 'banknote',
  },
  'JazzCash (Demo)': {
    name: 'JazzCash (Demo)',
    sandboxChannel: 'JazzCash Sandbox Simulation Gateway',
    simulatedAccount: 'DEMO-JC-0300-0000000 (Test Sandbox Only)',
    instructions:
      'Simulate an instant mobile wallet transfer via JazzCash Sandbox. No actual funds or credentials are requested.',
    icon: 'smartphone',
  },
  'Easypaisa (Demo)': {
    name: 'Easypaisa (Demo)',
    sandboxChannel: 'Easypaisa Sandbox Simulation Gateway',
    simulatedAccount: 'DEMO-EP-0345-0000000 (Test Sandbox Only)',
    instructions:
      'Simulate an instant mobile wallet transfer via Easypaisa Sandbox. No real money is required or transferred.',
    icon: 'wallet',
  },
  'Bank Transfer (Demo)': {
    name: 'Bank Transfer (Demo)',
    sandboxChannel: 'Meezan Bank Demo IBFT / Raast Sandbox',
    simulatedAccount: 'PK00 DEMO 0000 0000 0000 0000 (Test Sandbox Only)',
    instructions:
      'Simulate an online IBFT / Raast bank transfer. Fully simulated with zero financial risk or real banking connectivity.',
    icon: 'building',
  },
};

export const StudentTestForm: React.FC<StudentTestFormProps> = ({ onOpenAdmin }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    whatsappNumber: '',
    email: '',
    courseName: 'Full Stack Web & Cloud Development',
    hasScholarship: false,
    scholarshipCategory: 'Merit-Based',
    paymentMethod: 'Cash Payment' as DemoPaymentMethodType,
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Demo Payment Simulation State
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [paymentSimulated, setPaymentSimulated] = useState(false);
  const [demoTransactionId, setDemoTransactionId] = useState<string>('');
  const [demoSuccessMessage, setDemoSuccessMessage] = useState<string | null>(null);

  // Print and PDF generation states & loading indicators
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  const [submissionRecord, setSubmissionRecord] = useState<RegistrationRecordData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Courses
  const sampleCourses = [
    'Full Stack Web & Cloud Development',
    'Artificial Intelligence & Generative Agents',
    'Mobile App Development (Flutter & React Native)',
    'UI/UX Design & Digital Product Design',
    'Cyber Security & Ethical Hacking',
    'Cloud Computing & DevOps Engineering',
    'Other / Custom Course',
  ];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPG, PNG, or WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Photograph size must not exceed 2MB.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Dedicated Print Registration Handler using isolated iframe
  const handlePrint = () => {
    setPrintError(null);
    if (!submissionRecord) {
      setPrintError('No registration record is loaded to print. Please submit the form first.');
      return;
    }

    setIsPrinting(true);
    try {
      printRegistrationDocument(submissionRecord);
    } catch (err: any) {
      console.error('Print error:', err);
      setPrintError(err.message || 'Failed to open print preview.');
    } finally {
      setTimeout(() => setIsPrinting(false), 800);
    }
  };

  // Dedicated Vector PDF Download Handler using jsPDF
  const handleDownloadPdf = async () => {
    setPrintError(null);
    if (!submissionRecord) {
      setPrintError('No registration record is loaded to download. Please submit the form first.');
      return;
    }

    setIsGeneratingPdf(true);
    try {
      await downloadRegistrationPdf(submissionRecord);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setPrintError(err.message || 'Failed to generate PDF voucher.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Simulate Payment Handler
  const handleSimulatePayment = () => {
    setIsSimulatingPayment(true);
    setErrorMessage(null);

    setTimeout(() => {
      // Generate realistic demo transaction ID
      const prefix =
        formData.paymentMethod === 'Cash Payment'
          ? 'CASH-REC'
          : formData.paymentMethod === 'JazzCash (Demo)'
          ? 'DEMO-JC'
          : formData.paymentMethod === 'Easypaisa (Demo)'
          ? 'DEMO-EP'
          : 'DEMO-BNK';
      const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
      const generatedTrxId = `${prefix}-${randomDigits}`;

      setDemoTransactionId(generatedTrxId);
      setPaymentSimulated(true);
      setIsSimulatingPayment(false);
      setDemoSuccessMessage(
        'Demo Payment Successful! This is a demonstration only. No real money has been transferred.'
      );

      try {
        confetti({
          particleCount: 50,
          spread: 45,
          origin: { y: 0.7 },
        });
      } catch {}
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitSuccess(false);

    // Basic Validations
    if (!formData.studentName.trim() || formData.studentName.trim().length < 2) {
      setErrorMessage('Please enter student full name (at least 2 characters).');
      return;
    }

    const cleanPhone = formData.whatsappNumber.replace(/\D/g, '');
    if (cleanPhone.length < 7) {
      setErrorMessage('Please enter a valid WhatsApp number (at least 7 digits).');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@') || !formData.email.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!formData.courseName.trim()) {
      setErrorMessage('Please select or specify a course name.');
      return;
    }

    // Require simulated payment before submitting
    let finalTrx = demoTransactionId;
    if (!paymentSimulated || !finalTrx) {
      const prefix =
        formData.paymentMethod === 'Cash Payment'
          ? 'CASH-REC'
          : formData.paymentMethod === 'JazzCash (Demo)'
          ? 'DEMO-JC'
          : formData.paymentMethod === 'Easypaisa (Demo)'
          ? 'DEMO-EP'
          : 'DEMO-BNK';
      finalTrx = `${prefix}-${Math.floor(10000000 + Math.random() * 90000000)}`;
      setDemoTransactionId(finalTrx);
      setPaymentSimulated(true);
      setDemoSuccessMessage(
        'Demo Payment Successful! This is a demonstration only. No real money has been transferred.'
      );
    }

    setIsSubmitting(true);

    try {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error(
          'Supabase is not configured yet. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
        );
      }

      const newRefId = crypto.randomUUID();
      const demoStatus = 'Demo Payment — Not a Real Transaction';
      const nowIso = new Date().toISOString();

      // Database payment method mapping to satisfy check constraint
      const dbPaymentMethod =
        formData.paymentMethod === 'Cash Payment'
          ? 'Cash'
          : formData.paymentMethod === 'Bank Transfer (Demo)'
          ? 'Bank Transfer'
          : 'Online';

      // 1. Full payload targeting Supabase
      const fullPayload: any = {
        id: newRefId,
        student_name: formData.studentName.trim(),
        whatsapp_number: formData.whatsappNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        course_name: `${formData.courseName.trim()}${formData.hasScholarship ? ` [Scholarship: ${formData.scholarshipCategory}]` : ''}`,
        photo_url: photoPreview || null,
        has_scholarship: formData.hasScholarship,
        payment_method: dbPaymentMethod,
        transaction_id: finalTrx,
        payment_status: demoStatus,
      };

      const insertRes = await supabase.from('student_test_records').insert(fullPayload);

      if (insertRes.error) {
        console.warn('Full schema insert rejected, falling back to compatibility insert:', insertRes.error);

        // Fallback for database instances where custom columns or constraints are not yet migrated
        const legacyPayload: any = {
          id: newRefId,
          student_name: formData.studentName.trim(),
          whatsapp_number: formData.whatsappNumber.trim(),
          email: formData.email.trim().toLowerCase(),
          course_name: `${formData.courseName.trim()} [${formData.paymentMethod} | ${demoStatus} | Trx: ${finalTrx}${formData.hasScholarship ? ` | Scholarship: ${formData.scholarshipCategory}` : ''}]`,
          photo_url: photoPreview || null,
          has_scholarship: formData.hasScholarship,
          payment_method: dbPaymentMethod,
        };

        const fallbackRes = await supabase.from('student_test_records').insert(legacyPayload);
        if (fallbackRes.error) {
          throw new Error(fallbackRes.error.message || 'Database rejected the submission.');
        }
      }

      // Record state for display and printing
      setSubmissionRecord({
        id: newRefId,
        studentName: formData.studentName.trim(),
        whatsappNumber: formData.whatsappNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        courseName: formData.courseName.trim(),
        hasScholarship: formData.hasScholarship,
        scholarshipCategory: formData.hasScholarship ? formData.scholarshipCategory : undefined,
        paymentMethod: formData.paymentMethod,
        transactionId: finalTrx,
        paymentStatus: demoStatus,
        createdAt: nowIso,
      });

      setSubmitSuccess(true);

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}
    } catch (err: any) {
      console.error('Form submission failed:', err);
      setErrorMessage(err.message || 'Submission failed. Could not save to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeConfig = DEMO_PAYMENT_CONFIG[formData.paymentMethod];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Top Banner & Mode */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white no-print">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <NexoraLogo size="sm" />
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Student Registration Form
                </h1>
                <p className="text-xs text-indigo-200 font-medium mt-0.5">
                  Nexora Academy Official Portal
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-sm transition-all border border-white/20 text-indigo-100 hover:text-white cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-300" />
              Admin Verification View
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SUBMISSION SUCCESS CONFIRMATION & PRINTABLE REGISTRATION VOUCHER */}
        {/* ============================================================== */}
        {submitSuccess && submissionRecord ? (
          <div className="p-6 sm:p-8 text-center animate-in fade-in zoom-in-95">
            {/* Required Exact Demo Confirmation Message */}
            <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-left flex items-start gap-3 shadow-xs no-print">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-emerald-900">
                  Demo Payment Successful!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800 mt-1 font-semibold leading-relaxed">
                  Demo Payment Successful! This is a demonstration only. No real money has been transferred.
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                  <span>Status:</span>
                  <span className="font-extrabold">Demo Payment — Not a Real Transaction</span>
                </div>
              </div>
            </div>

            {/* Error banner if print or PDF fails */}
            {printError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 text-left no-print">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{printError}</span>
              </div>
            )}

            {/* Printable Registration Record Voucher */}
            <div
              id="student-registration-voucher"
              className="printable-record bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left space-y-5 shadow-sm mb-6"
            >
              {/* Header inside voucher for print */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <NexoraLogo size="sm" />
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                      Nexora Academy
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Official Student Registration & Demo Fee Voucher
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <FlaskConical className="w-3.5 h-3.5 text-amber-700" />
                    Demo Payment — Not a Real Transaction
                  </span>
                </div>
              </div>

              {/* Submission ID */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Registration / Reference ID
                </span>
                <p className="font-mono text-xs sm:text-sm font-bold text-indigo-700 break-all select-all">
                  {submissionRecord.id}
                </p>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">Student Full Name</span>
                  <span className="font-bold text-slate-900 text-sm">{submissionRecord.studentName}</span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">Enrolled Course</span>
                  <span className="font-bold text-indigo-900">{submissionRecord.courseName}</span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">WhatsApp Contact</span>
                  <span className="font-mono font-semibold text-slate-800">{submissionRecord.whatsappNumber}</span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">Email Address</span>
                  <span className="font-medium text-slate-800">{submissionRecord.email}</span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">Payment Method</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
                    {submissionRecord.paymentMethod}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">Demo Transaction ID</span>
                  <span className="font-mono font-bold text-indigo-800 break-all">
                    {submissionRecord.transactionId}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">Scholarship Request</span>
                  <span className="font-semibold text-slate-800">
                    {submissionRecord.hasScholarship
                      ? `Yes, Applied (${submissionRecord.scholarshipCategory || 'Scholarship'})`
                      : 'Standard Admission (No)'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">Registration Date</span>
                  <span className="font-mono text-slate-600">
                    {new Date(submissionRecord.createdAt).toLocaleString('en-PK')}
                  </span>
                </div>
              </div>

              {/* Attached photograph if present */}
              {submissionRecord.photoUrl && (
                <div className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <img
                    src={submissionRecord.photoUrl}
                    alt="Uploaded Student"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">Student Photograph Attached</span>
                    <span className="text-[11px] text-slate-400">Recorded with database submission</span>
                  </div>
                </div>
              )}

              {/* Demo Disclaimer Box for Print */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>DEMONSTRATION RECORD ONLY:</strong> No actual monetary transaction occurred. Not an official bank receipt.
                </span>
              </div>

              {/* Voucher footer info for print */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between text-[11px] text-slate-400 gap-1">
                <span>Database: Supabase PostgreSQL</span>
                <span>Payment Status: Demo Payment — Not a Real Transaction</span>
              </div>
            </div>

            {/* Print & PDF Action Buttons with Loading States */}
            <div className="no-print space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={isPrinting || isGeneratingPdf}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isPrinting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                      Preparing Document...
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4 text-indigo-300" />
                      Print Registration
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isPrinting || isGeneratingPdf}
                  className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Generating Vector PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download PDF
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitSuccess(false);
                    setSubmissionRecord(null);
                    setPaymentSimulated(false);
                    setDemoTransactionId('');
                    setDemoSuccessMessage(null);
                    setPrintError(null);
                    setFormData({
                      studentName: '',
                      whatsappNumber: '',
                      email: '',
                      courseName: 'Full Stack Web & Cloud Development',
                      hasScholarship: false,
                      scholarshipCategory: 'Merit-Based',
                      paymentMethod: 'Cash Payment',
                    });
                    setPhotoPreview(null);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Submit Another Registration
                </button>

                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer"
                >
                  Verify Submission
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* PUBLIC STUDENT REGISTRATION FORM                               */
          /* ============================================================== */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Error:</span> {errorMessage}
                </div>
              </div>
            )}

            {/* Student Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Student Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  placeholder="e.g. Muhammad Ali"
                  maxLength={150}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            {/* WhatsApp Number & Email Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  WhatsApp Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    placeholder="+92 300 1234567"
                    maxLength={30}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@example.com"
                    maxLength={255}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Course Name Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Course Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <select
                  required
                  value={formData.courseName}
                  onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800 bg-white"
                >
                  {sampleCourses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Student Photograph (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Student Photograph <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex items-center justify-center gap-4 ${
                  photoPreview
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />

                {photoPreview ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={photoPreview}
                      alt="Student"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm"
                    />
                    <div className="text-left">
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Photo Selected
                      </span>
                      <span className="text-[11px] text-slate-400 block">Click to change photo</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>Upload image (JPG/PNG under 2MB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Scholarship Question (Yes / No) with Category Selection */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
              <div>
                <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-2">
                  Do you have a scholarship? <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="hasScholarship"
                      checked={formData.hasScholarship === true}
                      onChange={() => setFormData({ ...formData, hasScholarship: true })}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>Yes, I have a scholarship</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="hasScholarship"
                      checked={formData.hasScholarship === false}
                      onChange={() => setFormData({ ...formData, hasScholarship: false })}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>No scholarship</span>
                  </label>
                </div>
              </div>

              {formData.hasScholarship && (
                <div className="pt-2 border-t border-amber-200/60">
                  <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-1.5">
                    Select Scholarship Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.scholarshipCategory}
                    onChange={(e) => setFormData({ ...formData, scholarshipCategory: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {SCHOLARSHIP_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* ============================================================== */}
            {/* DEMO-ONLY PAYMENT SYSTEM (NO REAL MONEY TRANSFERS)             */}
            {/* ============================================================== */}
            <div className="p-5 rounded-3xl bg-slate-50 border-2 border-indigo-100 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Select Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 flex items-center gap-1">
                    <FlaskConical className="w-3 h-3" /> DEMO SANDBOX
                  </span>
                </div>

                {/* 4 Options: Cash Payment + 3 Demo Options */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['Cash Payment', 'JazzCash (Demo)', 'Easypaisa (Demo)', 'Bank Transfer (Demo)'] as const).map(
                    (method) => {
                      const isSelected = formData.paymentMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, paymentMethod: method });
                            setPaymentSimulated(false);
                            setDemoTransactionId('');
                            setDemoSuccessMessage(null);
                          }}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/90 text-indigo-800 shadow-xs ring-2 ring-indigo-500/30'
                              : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {method === 'Cash Payment' && (
                            <Banknote className="w-5 h-5 mb-1.5 text-emerald-600" />
                          )}
                          {method === 'JazzCash (Demo)' && (
                            <Smartphone className="w-5 h-5 mb-1.5 text-amber-600" />
                          )}
                          {method === 'Easypaisa (Demo)' && (
                            <Wallet className="w-5 h-5 mb-1.5 text-emerald-600" />
                          )}
                          {method === 'Bank Transfer (Demo)' && (
                            <Building className="w-5 h-5 mb-1.5 text-blue-600" />
                          )}
                          <span className="text-center">{method}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Simulation Sandbox Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-700">Simulated Gateway:</span>
                  <span className="font-semibold text-slate-900">{activeConfig.sandboxChannel}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between text-[11px] gap-1">
                  <span className="text-slate-400">Sandbox Target:</span>
                  <span className="font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {activeConfig.simulatedAccount}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                  {activeConfig.instructions}
                </p>

                {/* Simulate Payment Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    disabled={isSimulatingPayment}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSimulatingPayment ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Simulating Sandbox Transfer...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        Simulate Payment
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Exact Required Demo Success Message Banner */}
              {demoSuccessMessage && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs space-y-1.5 animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Demo Payment Successful!</span>
                  </div>
                  <p className="font-medium text-emerald-800">
                    Demo Payment Successful! This is a demonstration only. No real money has been transferred.
                  </p>
                  <div className="pt-1.5 border-t border-emerald-200/80 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-700 font-semibold">Demo Reference:</span>
                    <span className="font-mono font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-300">
                      {demoTransactionId}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Submitting Registration to Database...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Submit Registration
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Database Verification Note */}
      <div className="text-center text-[11px] text-slate-400 no-print">
        Connected to Supabase PostgreSQL • Demo Mode Protected by Row Level Security (RLS)
      </div>
    </div>
  );
};
