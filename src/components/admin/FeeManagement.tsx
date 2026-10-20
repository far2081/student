import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, Payment, PaymentMethod } from '../../types';
import { PrintableReceipt } from './PrintableReceipt';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Receipt,
  Printer,
  History,
  X,
  ShieldCheck,
  Banknote,
} from 'lucide-react';

export const FeeManagement: React.FC = () => {
  const { students, courses, payments, adminUser, recordPayment } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');

  // Payment Recording Modal State
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<Student | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [cashConfirmed, setCashConfirmed] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Receipt to Print
  const [activeReceiptPayment, setActiveReceiptPayment] = useState<Payment | null>(null);
  const [activeReceiptStudent, setActiveReceiptStudent] = useState<Student | null>(null);

  // Student Payment History Modal
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (s.admission_status === 'archived') return false;

    const matchesSearch =
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.application_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.whatsapp.includes(searchTerm) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse =
      selectedCourseFilter === 'ALL' || s.course_id === selectedCourseFilter;

    const matchesPaymentStatus =
      paymentStatusFilter === 'ALL' ||
      (s.payment_status || 'Unpaid') === paymentStatusFilter;

    return matchesSearch && matchesCourse && matchesPaymentStatus;
  });

  const handleOpenPaymentModal = (student: Student) => {
    setSelectedStudentForPayment(student);
    const remaining = student.remaining_balance_pkr !== undefined ? student.remaining_balance_pkr : (student.final_payable_fee_pkr || 0);
    setPaymentAmount(remaining > 0 ? remaining : 0);
    setPaymentMethod('Cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentRef('');
    setPaymentNotes('');
    setCashConfirmed(true);
    setErrorMessage(null);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPayment) return;
    setErrorMessage(null);

    if (paymentAmount <= 0) {
      setErrorMessage('Payment amount must be greater than 0 PKR.');
      return;
    }

    if (paymentMethod === 'Cash' && !cashConfirmed) {
      setErrorMessage('You must confirm that cash was physically verified and received.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await recordPayment({
        studentId: selectedStudentForPayment.id,
        amountPaidPkr: Number(paymentAmount),
        paymentMethod: paymentMethod,
        paymentDate: paymentDate,
        paymentReference: paymentRef.trim() || undefined,
        receivedBy: adminUser?.full_name || 'Accounts Admin',
        notes: paymentNotes.trim() || undefined,
        isConfirmed: true,
      });

      if (res.success && res.payment) {
        const updatedStudent = {
          ...selectedStudentForPayment,
          total_paid_pkr: (selectedStudentForPayment.total_paid_pkr || 0) + Number(paymentAmount),
          remaining_balance_pkr: Math.max(
            0,
            (selectedStudentForPayment.remaining_balance_pkr || 0) - Number(paymentAmount)
          ),
        };
        setActiveReceiptPayment(res.payment);
        setActiveReceiptStudent(updatedStudent);
        setSelectedStudentForPayment(null);
      } else {
        setErrorMessage(res.error || 'Failed to record transaction.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment transaction failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5" /> Paid
          </span>
        );
      case 'Partially Paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" /> Partially Paid
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <AlertCircle className="w-3.5 h-3.5" /> Unpaid
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-indigo-600" /> Cash & Fee Management Registry
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Record verified cash payments, track installments, calculate balances, and issue official receipts.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, App ID, phone..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
          >
            <option value="ALL">All Programs</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="Paid">Fully Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Fee Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Student & App ID</th>
                <th className="py-3.5 px-4">Program</th>
                <th className="py-3.5 px-4 text-right">Original Fee</th>
                <th className="py-3.5 px-4 text-right">Discount</th>
                <th className="py-3.5 px-4 text-right">Final Payable</th>
                <th className="py-3.5 px-4 text-right">Amount Paid</th>
                <th className="py-3.5 px-4 text-right">Balance</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No student fee records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const finalPayable = s.final_payable_fee_pkr || s.original_fee_pkr || 0;
                  const totalPaid = s.total_paid_pkr || 0;
                  const balance = s.remaining_balance_pkr !== undefined ? s.remaining_balance_pkr : Math.max(0, finalPayable - totalPaid);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={s.photo_url}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{s.full_name}</p>
                            <span className="font-mono text-[11px] text-indigo-600 font-semibold">
                              {s.application_id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{s.course_code}</span>
                        <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{s.course_name}</p>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        Rs. {(s.original_fee_pkr || 0).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-emerald-600 font-semibold">
                        {(s.approved_discount_pkr || 0) > 0
                          ? `- Rs. ${s.approved_discount_pkr?.toLocaleString()}`
                          : 'Rs. 0'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        Rs. {finalPayable.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        Rs. {totalPaid.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-extrabold">
                        <span className={balance === 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          Rs. {balance.toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">{getStatusBadge(s.payment_status)}</td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenPaymentModal(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                            title="Record Payment"
                          >
                            <Plus className="w-3.5 h-3.5" /> Pay
                          </button>

                          <button
                            onClick={() => setHistoryStudent(s)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                            title="View Payment Receipts & History"
                          >
                            <History className="w-4 h-4" />
                          </button>
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

      {/* RECORD PAYMENT MODAL */}
      {selectedStudentForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">Record Fee Payment</h3>
              </div>
              <button
                onClick={() => setSelectedStudentForPayment(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student mini summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800">{selectedStudentForPayment.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">App ID:</span>
                <span className="font-mono font-bold text-indigo-600">{selectedStudentForPayment.application_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Program:</span>
                <span className="font-semibold">{selectedStudentForPayment.course_name}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                <span className="text-slate-700">Current Outstanding:</span>
                <span className="text-rose-600 font-mono">
                  PKR {(selectedStudentForPayment.remaining_balance_pkr || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Amount Received in PKR <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="100"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-indigo-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    <option value="Cash">Cash (Physical Counter)</option>
                    <option value="Bank Transfer">Bank Transfer / Online App</option>
                    <option value="Online Payment">Online Credit / Debit Card</option>
                    <option value="Other">Other Verified Method</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Transaction / Bank Ref Number
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. MBL-8823901 or Cheque #"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Notes / Memo
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. 1st installment, cash received by Farhana Aamir"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>

              {/* Cash physical confirmation check */}
              {paymentMethod === 'Cash' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={cashConfirmed}
                      onChange={(e) => setCashConfirmed(e.target.checked)}
                      className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs text-amber-900 leading-normal">
                      <strong>Cash Verification Certification:</strong> I hereby certify as an authorized accounts administrator that the exact amount of <strong>Rs. {paymentAmount.toLocaleString()} PKR</strong> was physically counted, verified, and deposited into the institute treasury.
                    </span>
                  </label>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForPayment(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isSubmitting ? 'Confirming...' : 'Confirm & Generate Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT PAYMENT HISTORY MODAL */}
      {historyStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Payment History & Receipts
                </h3>
                <p className="text-xs text-slate-500">
                  {historyStudent.full_name} ({historyStudent.application_id}) - {historyStudent.course_name}
                </p>
              </div>
              <button
                onClick={() => setHistoryStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of payments for this student */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {payments.filter((p) => p.student_id === historyStudent.id).length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No payment transactions have been recorded yet for this student.
                </div>
              ) : (
                payments
                  .filter((p) => p.student_id === historyStudent.id)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-700">
                            {p.receipt_number}
                          </span>
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {p.payment_method}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Date: {p.payment_date} • Received by: <strong>{p.received_by}</strong>
                        </p>
                        {p.notes && <p className="text-[11px] text-slate-400 mt-0.5">Memo: {p.notes}</p>}
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <div>
                          <span className="text-xs font-extrabold text-emerald-700 font-mono block">
                            Rs. {p.amount_paid_pkr.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold">Confirmed</span>
                        </div>

                        <button
                          onClick={() => {
                            setActiveReceiptPayment(p);
                            setActiveReceiptStudent(historyStudent);
                          }}
                          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-white shadow-xs"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-4 mt-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setHistoryStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      {activeReceiptPayment && activeReceiptStudent && (
        <PrintableReceipt
          payment={activeReceiptPayment}
          student={activeReceiptStudent}
          onClose={() => {
            setActiveReceiptPayment(null);
            setActiveReceiptStudent(null);
          }}
        />
      )}
    </div>
  );
};
