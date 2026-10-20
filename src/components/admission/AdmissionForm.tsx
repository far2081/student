import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Upload,
  User,
  Phone,
  Mail,
  GraduationCap,
  MapPin,
  FileText,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Search,
  Check,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { NexoraLogo } from '../common/NexoraLogo';

interface AdmissionFormProps {
  onCheckStatusClick: () => void;
}

export const AdmissionForm: React.FC<AdmissionFormProps> = ({ onCheckStatusClick }) => {
  const { courses, submitAdmissionForm } = useApp();

  const [formData, setFormData] = useState({
    fullName: '',
    whatsappCode: '+92',
    whatsappNumber: '',
    email: '',
    city: '',
    qualification: '',
    notes: '',
    courseId: '',
    isApplyingScholarship: false,
    scholarshipCategory: 'Merit-Based',
    scholarshipReason: '',
    privacyConsent: false,
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [docName, setDocName] = useState<string | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Filter only active courses for registration
  const activeCourses = courses.filter((c) => c.is_active);

  const selectedCourse = activeCourses.find((c) => c.id === formData.courseId);

  // Photo handling
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPG or PNG) for the student photograph.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Student photograph size must not exceed 2MB.');
      return;
    }

    setErrorMessage(null);
    setPhotoFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Scholarship Document handling
  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Supporting document size must not exceed 5MB.');
      return;
    }

    setErrorMessage(null);
    setDocName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      setDocPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!formData.fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    if (!formData.whatsappNumber.trim()) {
      setErrorMessage('Valid WhatsApp number is required.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Valid email address is required.');
      return;
    }

    if (!formData.courseId) {
      setErrorMessage('Please select a course to enroll in.');
      return;
    }

    if (!photoPreview) {
      setErrorMessage('Please upload a clear student passport-size photograph.');
      return;
    }

    if (formData.isApplyingScholarship && !formData.scholarshipReason.trim()) {
      setErrorMessage('Please provide a reason or statement for your scholarship request.');
      return;
    }

    if (!formData.privacyConsent) {
      setErrorMessage('You must consent to the privacy policy to submit your admission form.');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullWhatsApp = `${formData.whatsappCode} ${formData.whatsappNumber.trim()}`;

      const res = await submitAdmissionForm({
        fullName: formData.fullName,
        whatsapp: fullWhatsApp,
        email: formData.email,
        city: formData.city,
        qualification: formData.qualification,
        notes: formData.notes,
        photoUrl: photoPreview,
        courseId: formData.courseId,
        isApplyingScholarship: formData.isApplyingScholarship,
        scholarshipCategory: formData.isApplyingScholarship ? formData.scholarshipCategory : undefined,
        scholarshipReason: formData.isApplyingScholarship ? formData.scholarshipReason : undefined,
        scholarshipDocUrl: formData.isApplyingScholarship ? docPreview || undefined : undefined,
        privacyConsent: formData.privacyConsent,
      });

      if (res.success && res.applicationId) {
        setSubmittedAppId(res.applicationId);
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      } else {
        setErrorMessage(res.error || 'Failed to submit application. Please verify details.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Printable Application Voucher confirmation
  const handlePrintVoucher = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Success Modal / Screen */}
      {submittedAppId ? (
        <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-6 sm:p-10 transition-all print:border-none print:shadow-none">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <span className="text-xs font-bold tracking-widest text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full">
              Application Submitted Successfully
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
              Welcome to Nexora Academy
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mt-2">
              Your admission application has been registered in our official admissions database.
            </p>
          </div>

          {/* Application Voucher Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 print:bg-white print:border-black">
            <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-slate-200 gap-4">
              <NexoraLogo size="md" />
              <div className="text-right sm:text-right text-center">
                <span className="text-xs uppercase text-slate-500 font-semibold">Official Application ID</span>
                <p className="text-2xl font-mono font-bold text-indigo-600 tracking-wider">
                  {submittedAppId}
                </p>
                <span className="text-xs text-slate-400">Date: {new Date().toLocaleDateString('en-PK')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold">Applicant Details</span>
                <p className="text-base font-semibold text-slate-800 mt-1">{formData.fullName}</p>
                <p className="text-sm text-slate-600">{formData.email}</p>
                <p className="text-sm text-slate-600">{formData.whatsappCode} {formData.whatsappNumber}</p>
                {formData.city && <p className="text-xs text-slate-500 mt-1">City: {formData.city}</p>}
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-bold">Selected Program</span>
                <p className="text-base font-semibold text-indigo-700 mt-1">
                  {selectedCourse?.name || 'Academic Course'}
                </p>
                <p className="text-xs text-slate-500">Duration: {selectedCourse?.duration}</p>
                <div className="mt-2 text-sm font-semibold text-slate-800">
                  Course Fee: <span className="text-indigo-600">PKR {selectedCourse?.fee_pkr.toLocaleString()}</span>
                </div>
                {formData.isApplyingScholarship && (
                  <div className="mt-1">
                    <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      Scholarship Requested: {formData.scholarshipCategory} (Under Review)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 text-xs text-slate-500 space-y-1">
              <p>• Save your <strong>Application ID ({submittedAppId})</strong> for all correspondence.</p>
              <p>• Our admission counselor will contact you via WhatsApp for interview scheduling.</p>
              <p>• Scholarship discount will be verified and applied by the administrator before fee confirmation.</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 no-print">
            <button
              onClick={handlePrintVoucher}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              Print Application Voucher
            </button>
            <button
              onClick={onCheckStatusClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all"
            >
              <Search className="w-4 h-4 text-white" />
              Check Application Status
            </button>
            <button
              onClick={() => {
                setSubmittedAppId(null);
                setFormData({
                  fullName: '',
                  whatsappCode: '+92',
                  whatsappNumber: '',
                  email: '',
                  city: '',
                  qualification: '',
                  notes: '',
                  courseId: '',
                  isApplyingScholarship: false,
                  scholarshipCategory: 'Merit-Based',
                  scholarshipReason: '',
                  privacyConsent: false,
                });
                setPhotoPreview(null);
                setDocPreview(null);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm text-slate-500 hover:text-slate-800"
            >
              Submit Another Application
            </button>
          </div>
        </div>
      ) : (
        /* The Public Admission Form */
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white relative">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
                  <GraduationCap className="w-8 h-8 text-indigo-300" />
                </div>
                <div>
                  <span className="text-xs font-semibold tracking-wider uppercase text-indigo-300">
                    Official Admissions {new Date().getFullYear()}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Student Admission Form
                  </h1>
                </div>
              </div>
              <button
                type="button"
                onClick={onCheckStatusClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-sm transition-all border border-white/20"
              >
                <Search className="w-3.5 h-3.5 text-indigo-200" />
                Already Applied? Track Status
              </button>
            </div>
            <p className="text-xs sm:text-sm text-indigo-100/90 mt-3 max-w-2xl">
              Fill in your details below to apply for industry-standard professional certifications and degree-path programs. Scholarships are available for eligible candidates.
            </p>
          </div>

          {/* Form container */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Submission Incomplete:</span> {errorMessage}
                </div>
              </div>
            )}

            {/* SECTION 1: Personal & Contact Information */}
            <div>
              <div className="flex items-center gap-2 pb-3 mb-6 border-b border-slate-200">
                <User className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-800">1. Personal & Contact Information</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Muhammad Hamza"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* WhatsApp Number with Country Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="w-24 shrink-0">
                      <select
                        value={formData.whatsappCode}
                        onChange={(e) => setFormData({ ...formData, whatsappCode: e.target.value })}
                        className="w-full py-2.5 px-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-xs font-semibold text-slate-700"
                      >
                        <option value="+92">🇵🇰 +92</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+966">🇸🇦 +966</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+1">🇺🇸 +1</option>
                      </select>
                    </div>
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        required
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                        placeholder="300 1234567"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium text-slate-800 placeholder-slate-400"
                      />
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Admissions communication & interview updates will be sent here.
                  </span>
                </div>

                {/* Email Address */}
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* City (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    City <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Lahore, Karachi, Islamabad"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Educational Qualification (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Highest Qualification <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <select
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800 bg-white"
                    >
                      <option value="">Select qualification...</option>
                      <option value="Matric / O-Levels">Matric / O-Levels</option>
                      <option value="Intermediate / A-Levels">Intermediate / A-Levels</option>
                      <option value="Bachelors (BS / BA / BBA)">Bachelors (BS / BA / BBA)</option>
                      <option value="Masters / MS">Masters / MS</option>
                      <option value="Other / Diploma">Other / Diploma</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Course Selection & Photo Upload */}
            <div>
              <div className="flex items-center gap-2 pb-3 mb-6 border-b border-slate-200">
                <Award className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-800">2. Program Selection & Photograph</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Course Dropdown */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Select Program / Course <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800 bg-white shadow-sm"
                    >
                      <option value="">Choose an active course...</option>
                      {activeCourses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} - {c.name} ({c.duration})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Course Details Preview Card */}
                  {selectedCourse && (
                    <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-700 uppercase">{selectedCourse.code}</span>
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {selectedCourse.duration}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{selectedCourse.description}</p>
                      <div className="pt-2 border-t border-indigo-100 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Official Course Fee:</span>
                        <span className="text-base font-extrabold text-indigo-600">
                          PKR {selectedCourse.fee_pkr.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        *Installment plan available: up to {selectedCourse.installments_allowed} installments.
                      </span>
                    </div>
                  )}

                  {/* Additional Notes (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Additional Notes / Aspirations <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Share any background, learning goals, or preferred class shifts..."
                      className="w-full p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Photograph Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Student Photograph <span className="text-rose-500">*</span>
                  </label>
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                      photoPreview
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70 hover:border-indigo-400'
                    }`}
                  >
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />

                    {photoPreview ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={photoPreview}
                          alt="Student Preview"
                          className="w-28 h-28 object-cover rounded-xl shadow-md border-2 border-white mb-3"
                        />
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <Check className="w-3.5 h-3.5" /> Photo Attached
                        </span>
                        <span className="text-[11px] text-slate-500 mt-1">Click to replace photo</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          Click to upload passport-size photo
                        </span>
                        <span className="text-[11px] text-slate-500 mt-1">
                          JPG, PNG or WebP up to 2MB
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: Scholarship Application */}
            <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200/80">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-amber-200/60">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-amber-900">3. Scholarship & Financial Assistance</h2>
              </div>

              {/* Yes / No Toggle */}
              <div className="space-y-4">
                <span className="block text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Are you applying for a scholarship or fee concession?
                </span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-amber-300 bg-white cursor-pointer hover:bg-amber-50/50 transition-all">
                    <input
                      type="radio"
                      name="scholarship"
                      checked={formData.isApplyingScholarship}
                      onChange={() => setFormData({ ...formData, isApplyingScholarship: true })}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm font-semibold text-slate-800">Yes, apply for scholarship</span>
                  </label>

                  <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white cursor-pointer hover:bg-slate-50 transition-all">
                    <input
                      type="radio"
                      name="scholarship"
                      checked={!formData.isApplyingScholarship}
                      onChange={() => setFormData({ ...formData, isApplyingScholarship: false })}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-semibold text-slate-800">No, standard enrollment</span>
                  </label>
                </div>
              </div>

              {/* Conditional Scholarship Form Fields */}
              {formData.isApplyingScholarship && (
                <div className="mt-6 pt-6 border-t border-amber-200/60 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-2">
                        Scholarship Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.scholarshipCategory}
                        onChange={(e) => setFormData({ ...formData, scholarshipCategory: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Merit-Based">Merit-Based (High Academic Records)</option>
                        <option value="Need-Based">Need-Based (Financial Hardship)</option>
                        <option value="Female Empowerment">Female Empowerment in Tech</option>
                        <option value="Orphan / Disability">Orphan / Special Ability</option>
                        <option value="Hafiz-e-Quran">Hafiz-e-Quran</option>
                        <option value="Other">Other Specific Consideration</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-2">
                        Supporting Document <span className="text-slate-500 font-normal">(Marksheet/Income Proof)</span>
                      </label>
                      <div
                        onClick={() => docInputRef.current?.click()}
                        className="p-2.5 rounded-xl border border-dashed border-amber-400 bg-white text-center cursor-pointer hover:bg-amber-50/50 flex items-center justify-center gap-2 text-xs font-medium text-slate-700"
                      >
                        <FileText className="w-4 h-4 text-amber-600" />
                        <span className="truncate max-w-[200px]">
                          {docName || 'Upload PDF, JPG or PNG (Max 5MB)'}
                        </span>
                        <input
                          ref={docInputRef}
                          type="file"
                          accept="application/pdf,image/*"
                          onChange={handleDocChange}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-2">
                      Reason for Requesting Scholarship <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required={formData.isApplyingScholarship}
                      value={formData.scholarshipReason}
                      onChange={(e) => setFormData({ ...formData, scholarshipReason: e.target.value })}
                      placeholder="Briefly explain your financial or merit background and why you are applying for this assistance..."
                      className="w-full p-3 rounded-xl border border-amber-300 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="text-[11px] text-amber-900 bg-amber-100/70 p-3 rounded-lg flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      Scholarship applications are audited by the academic committee. Discounts range from 10% to 100% and will reflect in your final payable fee once officially approved.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: Consent & Submission */}
            <div className="pt-4 border-t border-slate-200 space-y-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formData.privacyConsent}
                  onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
                  className="w-4 h-4 mt-1 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs text-slate-600 leading-normal">
                  I hereby declare that all submitted personal, academic, and document details are authentic. I consent to Nexora Academy's student data privacy policy and understand that false information will lead to immediate cancellation of admission.
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-bold text-base shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing Application...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Submit Admission Application
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
