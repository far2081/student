import React, { useState, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { NexoraLogo } from '../common/NexoraLogo';
import {
  CheckCircle2,
  AlertCircle,
  Upload,
  User,
  Phone,
  Mail,
  BookOpen,
  CreditCard,
  Lock,
  Check,
  RefreshCw,
  Printer,
  Download,
  Clock,
  Building,
  Smartphone,
  Wallet,
  Receipt,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudentTestFormProps {
  onOpenAdmin: () => void;
}

export type PaymentMethodType = 'Cash' | 'JazzCash' | 'Easypaisa' | 'Bank Transfer';

// Configurable recipient account details with clearly marked placeholders
export const PAYMENT_METHOD_CONFIG: Record<
  PaymentMethodType,
  {
    name: string;
    accountTitle: string;
    accountNumber: string;
    bankName?: string;
    instructions: string;
    trxLabel: string;
    trxPlaceholder: string;
    badgeStyle: string;
  }
> = {
  JazzCash: {
    name: 'JazzCash',
    accountTitle: 'Nexora Academy [Admin Name]',
    accountNumber: '0300-XXXXXXX [Placeholder - Configure Admin Number]',
    instructions:
      'Open your JazzCash App or dial *786#. Transfer fee to the mobile account above, then enter the 10-12 digit Transaction ID (TID) received via SMS below.',
    trxLabel: 'JazzCash TID / Transaction ID',
    trxPlaceholder: 'e.g. TID-98234823412',
    badgeStyle: 'bg-amber-50 text-amber-900 border-amber-300',
  },
  Easypaisa: {
    name: 'Easypaisa',
    accountTitle: 'Nexora Academy [Admin Name]',
    accountNumber: '0345-XXXXXXX [Placeholder - Configure Admin Number]',
    instructions:
      'Open your Easypaisa App or visit an Easypaisa shop. Send fee to the mobile number above, then enter the TRX ID received from 3737 in SMS below.',
    trxLabel: 'Easypaisa TRX ID',
    trxPlaceholder: 'e.g. 78392019482',
    badgeStyle: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  },
  'Bank Transfer': {
    name: 'Bank Transfer',
    bankName: 'Meezan Bank Ltd [Placeholder]',
    accountTitle: 'Nexora Academy [Account Title]',
    accountNumber: 'PK00 MEZN 0000 0000 0000 0000 [Placeholder - Configure IBAN]',
    instructions:
      'Transfer via Mobile Banking App, Raast, or ATM. Enter the Bank Reference / Transaction ID from your payment receipt below.',
    trxLabel: 'Bank Reference / Transaction ID',
    trxPlaceholder: 'e.g. MEZN-839218392 or Raast Ref',
    badgeStyle: 'bg-blue-50 text-blue-900 border-blue-300',
  },
  Cash: {
    name: 'Cash Payment',
    accountTitle: 'Admission Office / Finance Counter',
    accountNumber: 'Nexora Academy Campus Counter (9:00 AM - 5:00 PM)',
    instructions:
      'Pay in cash directly at the campus admission counter. If a manual receipt was issued, enter its number below or keep CASH-COUNTER.',
    trxLabel: 'Cash Receipt # / Reference',
    trxPlaceholder: 'e.g. CASH-COUNTER or Manual Receipt #',
    badgeStyle: 'bg-slate-50 text-slate-800 border-slate-300',
  },
};

export const StudentTestForm: React.FC<StudentTestFormProps> = ({ onOpenAdmin }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    whatsappNumber: '',
    email: '',
    courseName: 'Full Stack Web & Cloud Development',
    hasScholarship: false,
    paymentMethod: 'JazzCash' as PaymentMethodType,
    transactionId: '',
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionRecord, setSubmissionRecord] = useState<{
    id: string;
    studentName: string;
    whatsappNumber: string;
    email: string;
    courseName: string;
    hasScholarship: boolean;
    paymentMethod: PaymentMethodType;
    transactionId: string;
    paymentStatus: string;
    createdAt: string;
    photoUrl: string | null;
  } | null>(null);
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const originalTitle = document.title;
    document.title = `Registration_Voucher_${submissionRecord?.id || 'Record'}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
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

    // Transaction ID validation: Required for online/digital methods (JazzCash, Easypaisa, Bank Transfer)
    if (formData.paymentMethod !== 'Cash' && !formData.transactionId.trim()) {
      setErrorMessage(
        `Please enter the required Transaction ID / Reference Number for ${formData.paymentMethod}.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error(
          'Supabase is not configured yet. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
        );
      }

      // Generate client UUID for exact submission reference ID
      const newRefId = crypto.randomUUID();
      const finalTrxId = formData.transactionId.trim() || (formData.paymentMethod === 'Cash' ? 'CASH-COUNTER' : 'PENDING');
      const finalPaymentStatus = 'Pending Verification';
      const nowIso = new Date().toISOString();

      // Full payload including transaction_id and payment_status
      const fullPayload: any = {
        id: newRefId,
        student_name: formData.studentName.trim(),
        whatsapp_number: formData.whatsappNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        course_name: formData.courseName.trim(),
        photo_url: photoPreview || null,
        has_scholarship: formData.hasScholarship,
        payment_method: formData.paymentMethod,
        transaction_id: finalTrxId,
        payment_status: finalPaymentStatus,
      };

      // Direct Supabase INSERT
      const insertRes = await supabase.from('student_test_records').insert(fullPayload);

      if (insertRes.error) {
        console.warn('Supabase insert with full fields encountered:', insertRes.error);

        // Fallback for database instances that haven't executed the ALTER TABLE migration yet
        if (
          insertRes.error.code === 'PGRST204' ||
          insertRes.error.message?.includes('payment_status') ||
          insertRes.error.message?.includes('transaction_id') ||
          insertRes.error.code === '42501'
        ) {
          console.info('Attempting compatibility insert using base schema...');
          const legacyPayload: any = {
            id: newRefId,
            student_name: formData.studentName.trim(),
            whatsapp_number: formData.whatsappNumber.trim(),
            email: formData.email.trim().toLowerCase(),
            course_name: `${formData.courseName.trim()}${finalTrxId ? ` [Trx: ${finalTrxId}]` : ''}`,
            photo_url: photoPreview || null,
            has_scholarship: formData.hasScholarship,
            payment_method:
              formData.paymentMethod === 'Cash' || formData.paymentMethod === 'Bank Transfer'
                ? formData.paymentMethod
                : 'Online',
          };

          const fallbackRes = await supabase.from('student_test_records').insert(legacyPayload);
          if (fallbackRes.error) {
            throw new Error(fallbackRes.error.message || 'Database rejected the submission.');
          }
        } else {
          throw new Error(insertRes.error.message || 'Database rejected the submission.');
        }
      }

      // Save submission record state for voucher and print
      setSubmissionRecord({
        id: newRefId,
        studentName: formData.studentName.trim(),
        whatsappNumber: formData.whatsappNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        courseName: formData.courseName.trim(),
        hasScholarship: formData.hasScholarship,
        paymentMethod: formData.paymentMethod,
        transactionId: finalTrxId,
        paymentStatus: finalPaymentStatus,
        createdAt: nowIso,
        photoUrl: photoPreview || null,
      });

      setSubmitSuccess(true);

      // Trigger celebration
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

  const currentPaymentConfig = PAYMENT_METHOD_CONFIG[formData.paymentMethod];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Top Banner & Mode */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden mb-6 no-print">
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <NexoraLogo size="sm" />
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Student Registration Form
                </h1>
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
            {/* Required Payment Confirmation Message Banner */}
            <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-left flex items-start gap-3 shadow-xs">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-amber-900">
                  Your registration has been submitted successfully.
                </h3>
                <p className="text-xs sm:text-sm text-amber-800 mt-1 font-medium leading-relaxed">
                  Your registration has been submitted successfully. Your payment details have been received and are pending verification.
                </p>
              </div>
            </div>

            {/* Printable Registration Record Card */}
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
                      Official Student Registration & Fee Voucher
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    Pending Verification
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
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                    {submissionRecord.paymentMethod}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">Transaction ID / Reference</span>
                  <span className="font-mono font-bold text-indigo-800 break-all">
                    {submissionRecord.transactionId}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">Scholarship Request</span>
                  <span className="font-semibold text-slate-800">
                    {submissionRecord.hasScholarship ? 'Yes, Scholarship Applied' : 'Standard Admission'}
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

              {/* Voucher footer info for print */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between text-[11px] text-slate-400 gap-1">
                <span>Database: Supabase PostgreSQL (Verified Insert)</span>
                <span>Payment Status: Pending Verification</span>
              </div>
            </div>

            {/* Print & PDF Action Buttons */}
            <div className="no-print space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-indigo-300" />
                  Print Registration
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitSuccess(false);
                    setSubmissionRecord(null);
                    setFormData({
                      studentName: '',
                      whatsappNumber: '',
                      email: '',
                      courseName: 'Full Stack Web & Cloud Development',
                      hasScholarship: false,
                      paymentMethod: 'JazzCash',
                      transactionId: '',
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

            {/* Scholarship Question (Yes / No) */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
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

            {/* ============================================================== */}
            {/* PAYMENT METHOD SELECTION (JAZZCASH, EASYPAISA, BANK, CASH)     */}
            {/* ============================================================== */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Preferred Payment Method <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                  {(['JazzCash', 'Easypaisa', 'Bank Transfer', 'Cash'] as const).map((method) => {
                    const isSelected = formData.paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            paymentMethod: method,
                            transactionId: method === 'Cash' ? '' : formData.transactionId,
                          })
                        }
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 shadow-xs ring-2 ring-indigo-500/20'
                            : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {method === 'JazzCash' && <Smartphone className="w-5 h-5 mb-1 text-amber-600" />}
                        {method === 'Easypaisa' && <Wallet className="w-5 h-5 mb-1 text-emerald-600" />}
                        {method === 'Bank Transfer' && <Building className="w-5 h-5 mb-1 text-blue-600" />}
                        {method === 'Cash' && <CreditCard className="w-5 h-5 mb-1 text-slate-600" />}
                        <span className="text-center">{method}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recipient Account Details & Instructions Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                    <Info className="w-4 h-4 text-indigo-600" />
                    Recipient Account Details ({currentPaymentConfig.name})
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Verified Channel
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-700">
                  {currentPaymentConfig.bankName && (
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="text-slate-400 font-medium">Bank Name:</span>
                      <span className="font-bold text-slate-900">{currentPaymentConfig.bankName}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="text-slate-400 font-medium">Account Title:</span>
                    <span className="font-bold text-slate-900">{currentPaymentConfig.accountTitle}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="text-slate-400 font-medium">
                      {formData.paymentMethod === 'Bank Transfer' ? 'IBAN / Account Number:' : 'Mobile Account Number:'}
                    </span>
                    <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200 select-all">
                      {currentPaymentConfig.accountNumber}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-slate-500 text-[11px] leading-relaxed">
                  <span className="font-bold text-slate-700">Instructions:</span> {currentPaymentConfig.instructions}
                </div>
              </div>

              {/* Required Transaction ID / Reference Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {currentPaymentConfig.trxLabel}{' '}
                  {formData.paymentMethod !== 'Cash' ? (
                    <span className="text-rose-500">* (Required)</span>
                  ) : (
                    <span className="text-slate-400 font-normal">(Optional for Counter Cash)</span>
                  )}
                </label>
                <div className="relative">
                  <Receipt className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required={formData.paymentMethod !== 'Cash'}
                    value={formData.transactionId}
                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                    placeholder={currentPaymentConfig.trxPlaceholder}
                    maxLength={100}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono font-medium text-slate-800 placeholder-slate-400"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Initial payment status will be recorded as <strong>Pending Verification</strong> until verified by admin.
                </p>
              </div>
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
                    Recording Registration & Payment Details...
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
        Connected to Supabase PostgreSQL • Protected by Row Level Security (RLS)
      </div>
    </div>
  );
};
