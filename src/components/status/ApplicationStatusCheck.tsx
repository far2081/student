import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  GraduationCap,
  Sparkles,
  PhoneCall,
  Printer,
  ArrowLeft,
} from 'lucide-react';
import { NexoraLogo } from '../common/NexoraLogo';

interface ApplicationStatusCheckProps {
  onBackToForm: () => void;
}

export const ApplicationStatusCheck: React.FC<ApplicationStatusCheckProps> = ({ onBackToForm }) => {
  const { verifyStudentApplication } = useApp();

  const [applicationId, setApplicationId] = useState('');
  const [verificationInput, setVerificationInput] = useState('');
  const [studentRecord, setStudentRecord] = useState<Student | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStudentRecord(null);

    if (!applicationId.trim()) {
      setErrorMessage('Please enter your Application ID (e.g. NX-2610-1001).');
      return;
    }

    if (!verificationInput.trim()) {
      setErrorMessage('Please enter the WhatsApp number or email address used during registration.');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const student = await verifyStudentApplication(applicationId, verificationInput);
      if (student) {
        setStudentRecord(student);
      } else {
        setErrorMessage(
          'No matching application record found. Please verify that your Application ID and phone/email match your registration exactly.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during verification.');
    } finally {
      setIsSearching(false);
    }
  };

  const getAdmissionStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Admission Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Not Accepted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Under Academic Review
          </span>
        );
    }
  };

  const getScholarshipBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <Sparkles className="w-3 h-3 text-emerald-600" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            Standard Fee
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" /> In Review
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">Not Applied</span>;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={onBackToForm}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admission Registration
        </button>
      </div>

      {/* Verification Lookup Box */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8 mb-8">
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Student Application Status Lookup
            </h1>
            <p className="text-xs text-slate-500">
              Secure identity verification is required to view your personal application records.
            </p>
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Application ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
                placeholder="e.g. NX-2610-1001"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Registered Phone or Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={verificationInput}
                onChange={(e) => setVerificationInput(e.target.value)}
                placeholder="03001234567 or email"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSearching}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isSearching ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying Record...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Verify & Track Status
              </>
            )}
          </button>
        </form>
      </div>

      {/* Verified Student Details Card */}
      {studentRecord && (
        <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-6 sm:p-8 transition-all print:border-none print:shadow-none">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
            <div className="flex items-center gap-4">
              <img
                src={studentRecord.photo_url}
                alt={studentRecord.full_name}
                className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200 shadow-sm"
              />
              <div>
                <span className="text-xs uppercase font-mono text-indigo-600 font-bold">
                  {studentRecord.application_id}
                </span>
                <h2 className="text-xl font-bold text-slate-900">{studentRecord.full_name}</h2>
                <span className="text-xs text-slate-500">
                  Registered: {new Date(studentRecord.created_at).toLocaleDateString('en-PK')}
                </span>
              </div>
            </div>

            <div>{getAdmissionStatusBadge(studentRecord.admission_status)}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Academic Program */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Enrolled Program</span>
              <p className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                {studentRecord.course_name || 'Academic Course'}
              </p>
              <div className="text-xs text-slate-600 space-y-1">
                <p>Code: <span className="font-semibold">{studentRecord.course_code}</span></p>
                <p>Duration: <span className="font-semibold">{studentRecord.course_duration}</span></p>
                {studentRecord.city && <p>Campus / City: <span className="font-semibold">{studentRecord.city}</span></p>}
              </div>
            </div>

            {/* Scholarship Status */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Scholarship Record</span>
                {getScholarshipBadge(studentRecord.scholarship_status)}
              </div>
              {studentRecord.scholarship_category && (
                <p className="text-xs text-slate-700">
                  Category: <strong>{studentRecord.scholarship_category}</strong>
                </p>
              )}
              {studentRecord.scholarship_status === 'approved' ? (
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  Approved Concession: PKR {(studentRecord.approved_discount_pkr || 0).toLocaleString()}
                </div>
              ) : studentRecord.scholarship_status === 'pending' ? (
                <p className="text-[11px] text-amber-700">
                  Your scholarship request is currently being evaluated by the board.
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Standard tuition fee applies to this admission.
                </p>
              )}
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="mt-6 p-5 rounded-xl bg-indigo-50/60 border border-indigo-100">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-indigo-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Official Fee & Payment Ledger
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Original Fee</span>
                <p className="text-sm font-bold text-slate-800">
                  PKR {(studentRecord.original_fee_pkr || 0).toLocaleString()}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-emerald-600 uppercase font-semibold">Discount</span>
                <p className="text-sm font-bold text-emerald-700">
                  - PKR {(studentRecord.approved_discount_pkr || 0).toLocaleString()}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-indigo-600 uppercase font-semibold">Final Payable</span>
                <p className="text-sm font-bold text-indigo-900">
                  PKR {(studentRecord.final_payable_fee_pkr || studentRecord.original_fee_pkr || 0).toLocaleString()}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Remaining Balance</span>
                <p className={`text-base font-extrabold ${
                  (studentRecord.remaining_balance_pkr || 0) === 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  PKR {(studentRecord.remaining_balance_pkr !== undefined ? studentRecord.remaining_balance_pkr : (studentRecord.final_payable_fee_pkr || 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps & Support */}
          <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-indigo-600" />
              <span>Need help? Contact Admissions WhatsApp: <strong>+92 300 0000000</strong></span>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 no-print"
            >
              <Printer className="w-3.5 h-3.5" /> Print Status Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
