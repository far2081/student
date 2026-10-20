import React from 'react';
import { Payment, Student } from '../../types';
import { NexoraLogo } from '../common/NexoraLogo';
import { Printer, X, CheckCircle, ShieldCheck } from 'lucide-react';

interface PrintableReceiptProps {
  payment: Payment;
  student: Student;
  onClose: () => void;
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({
  payment,
  student,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const finalPayable = student.final_payable_fee_pkr || student.original_fee_pkr || 0;
  const currentRemaining = student.remaining_balance_pkr !== undefined ? student.remaining_balance_pkr : Math.max(0, finalPayable - (student.total_paid_pkr || 0));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-10 relative print:border-none print:shadow-none print:p-2">
        {/* Modal Top Control Bar (Hidden during print) */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
              Payment Confirmed
            </span>
            <span className="text-xs font-mono text-slate-500">{payment.receipt_number}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* OFFICIAL PRINTABLE FEE RECEIPT VOUCHER                         */}
        {/* ============================================================== */}
        <div className="border-2 border-slate-900 rounded-xl p-6 sm:p-8 bg-white text-slate-900">
          {/* Header */}
          <div className="flex items-start justify-between pb-6 border-b-2 border-slate-900 gap-4">
            <div>
              <NexoraLogo size="lg" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-2">
                Official Fee Receipt & Student Ledger
              </p>
              <span className="text-[11px] text-slate-500">
                National Tax / Reg ID: <strong>PK-NXR-2026-ADM</strong>
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold uppercase text-slate-500">Receipt Number</span>
              <p className="text-xl sm:text-2xl font-mono font-extrabold text-indigo-700">
                {payment.receipt_number}
              </p>
              <div className="mt-2 text-xs font-semibold text-slate-600">
                <p>Date: {payment.payment_date}</p>
                <p>Method: <strong className="text-slate-900">{payment.payment_method}</strong></p>
              </div>
            </div>
          </div>

          {/* Student Info Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-300 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Student Name</span>
              <p className="text-sm font-extrabold text-slate-900">{student.full_name}</p>
              <p className="text-slate-600">{student.email}</p>
              <p className="text-slate-600 font-mono">{student.whatsapp}</p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Academic Program</span>
              <p className="text-sm font-extrabold text-slate-900">{student.course_name}</p>
              <p className="text-slate-600 font-mono">App ID: {student.application_id}</p>
              <p className="text-slate-600">Duration: {student.course_duration}</p>
            </div>
          </div>

          {/* Payment Breakdown Table */}
          <div className="py-4 border-b-2 border-slate-900">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-left font-bold text-slate-500 uppercase">
                  <th className="py-2">Fee Description</th>
                  <th className="py-2 text-right">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="py-2.5">Original Course Tuition Fee</td>
                  <td className="py-2.5 text-right font-mono">
                    Rs. {(student.original_fee_pkr || 0).toLocaleString()}
                  </td>
                </tr>

                {(student.approved_discount_pkr || 0) > 0 && (
                  <tr className="text-emerald-700">
                    <td className="py-2.5">
                      Approved Scholarship Discount ({student.scholarship_category || 'Academic Concession'})
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold">
                      - Rs. {(student.approved_discount_pkr || 0).toLocaleString()}
                    </td>
                  </tr>
                )}

                <tr className="font-bold text-slate-900 bg-slate-50">
                  <td className="py-2.5 px-1">Net Payable Course Fee</td>
                  <td className="py-2.5 px-1 text-right font-mono text-indigo-900">
                    Rs. {finalPayable.toLocaleString()}
                  </td>
                </tr>

                <tr className="font-extrabold text-emerald-800 bg-emerald-50/70 border-t-2 border-emerald-300">
                  <td className="py-3 px-1 text-sm flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Amount Received in This Transaction
                  </td>
                  <td className="py-3 px-1 text-right font-mono text-base text-emerald-700">
                    Rs. {payment.amount_paid_pkr.toLocaleString()}
                  </td>
                </tr>

                <tr className="font-bold text-slate-900">
                  <td className="py-2.5">Total Confirmed Payments to Date</td>
                  <td className="py-2.5 text-right font-mono text-slate-800">
                    Rs. {(student.total_paid_pkr || 0).toLocaleString()}
                  </td>
                </tr>

                <tr className="font-extrabold bg-rose-50 text-rose-900">
                  <td className="py-2.5 px-1">Remaining Outstanding Fee Balance</td>
                  <td className="py-2.5 px-1 text-right font-mono text-sm text-rose-700">
                    Rs. {currentRemaining.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes & Verification */}
          <div className="py-3 text-[11px] text-slate-500 flex justify-between items-start gap-4">
            <div>
              <p>Received By: <strong>{payment.received_by}</strong></p>
              {payment.payment_reference && (
                <p>Transaction / Bank Ref: <span className="font-mono">{payment.payment_reference}</span></p>
              )}
              {payment.notes && <p>Officer Notes: {payment.notes}</p>}
            </div>
            <div className="text-right">
              <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Cashier Confirmed & Verified
              </span>
            </div>
          </div>

          {/* Signatures & Seal */}
          <div className="pt-10 mt-6 border-t border-slate-200 flex justify-between items-end text-xs">
            <div className="text-center">
              <div className="w-40 border-b border-slate-400 mb-1" />
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Student Signature</span>
            </div>

            <div className="text-center">
              <div className="w-44 border-b-2 border-slate-800 mb-1" />
              <span className="text-[10px] text-slate-800 uppercase font-extrabold">Authorized Accounts Officer</span>
              <p className="text-[9px] text-slate-400">Nexora Academy Official Seal</p>
            </div>
          </div>
        </div>

        {/* Exact Footer */}
        <div className="mt-6 text-center text-xs text-slate-500 no-print">
          <p className="font-semibold">Created by farhana Aamir</p>
          <a href="mailto:farzunmir@gmail.com" className="text-indigo-600 hover:underline">
            farzunmir@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
};
