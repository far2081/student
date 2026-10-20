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
  Sparkles,
  Lock,
  ArrowRight,
  ShieldCheck,
  Check,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudentTestFormProps {
  onOpenAdmin: () => void;
}

export const StudentTestForm: React.FC<StudentTestFormProps> = ({ onOpenAdmin }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    whatsappNumber: '',
    email: '',
    courseName: 'Full Stack Web & Cloud Development',
    hasScholarship: false,
    paymentMethod: 'Cash' as 'Cash' | 'Online' | 'Bank Transfer',
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default courses for class test
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitSuccess(false);
    setSubmissionId(null);

    // Validation
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

    setIsSubmitting(true);

    try {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error(
          'Supabase is not configured yet. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
        );
      }

      // 1. Direct Supabase INSERT into student_test_records
      const { data, error } = await supabase
        .from('student_test_records')
        .insert({
          student_name: formData.studentName.trim(),
          whatsapp_number: formData.whatsappNumber.trim(),
          email: formData.email.trim().toLowerCase(),
          course_name: formData.courseName.trim(),
          photo_url: photoPreview || null,
          has_scholarship: formData.hasScholarship,
          payment_method: formData.paymentMethod,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        if (error.code === 'PGRST205' || error.message?.includes('not find the table')) {
          throw new Error(
            'Database table "student_test_records" was not found in Supabase. Please copy and run student_test_records_schema.sql in your Supabase SQL Editor.'
          );
        }
        throw new Error(error.message || 'Database rejected the submission.');
      }

      // Successful Supabase insert!
      const newRefId = data?.id ? String(data.id) : `NX-${Date.now().toString().slice(-6)}`;
      setSubmissionId(newRefId);
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Top Banner & Mode */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <NexoraLogo size="sm" />
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                  Official Class Registration Test
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">
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
          <p className="text-xs text-indigo-200/90 mt-3">
            Please fill in your authentic details. Your submission will be recorded directly into the Supabase database.
          </p>
        </div>

        {/* Form Body or Success State */}
        {submitSuccess && submissionId ? (
          <div className="p-8 sm:p-10 text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
              Registration Submitted Successfully
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto mb-6">
              Your registration has been submitted successfully and permanently recorded in the database.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-md mx-auto text-left space-y-2 mb-6">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Database Submission Reference ID
              </span>
              <p className="font-mono text-xs sm:text-sm font-bold text-indigo-700 break-all bg-white p-2.5 rounded-xl border border-slate-200 select-all">
                {submissionId}
              </p>
              <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                <p>Candidate: <strong>{formData.studentName}</strong></p>
                <p>Course: <strong>{formData.courseName}</strong></p>
                <p>Payment: <strong>{formData.paymentMethod}</strong></p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubmitSuccess(false);
                  setSubmissionId(null);
                  setFormData({
                    studentName: '',
                    whatsappNumber: '',
                    email: '',
                    courseName: 'Full Stack Web & Cloud Development',
                    hasScholarship: false,
                    paymentMethod: 'Cash',
                  });
                  setPhotoPreview(null);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 shadow-md transition-all cursor-pointer"
              >
                Submit Another Registration
              </button>

              <button
                type="button"
                onClick={onOpenAdmin}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                Go to Admin Verification
              </button>
            </div>
          </div>
        ) : (
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

            {/* Preferred Payment Method */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Preferred Payment Method <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {(['Cash', 'Online', 'Bank Transfer'] as const).map((method) => (
                  <label
                    key={method}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      formData.paymentMethod === method
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-sm'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={formData.paymentMethod === method}
                      onChange={() => setFormData({ ...formData, paymentMethod: method })}
                      className="hidden"
                    />
                    <span>{method}</span>
                  </label>
                ))}
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
                    Saving to Supabase Database...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Submit Form
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Database Verification Note */}
      <div className="text-center text-[11px] text-slate-400">
        Connected to Supabase PostgreSQL • Protected by Row Level Security (RLS)
      </div>
    </div>
  );
};
