import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Users,
  Award,
  BookOpen,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { students, courses, payments, metrics } = useApp();

  const [activeReportTab, setActiveReportTab] = useState<
    | 'all_students'
    | 'approved_admissions'
    | 'scholarships'
    | 'cash_collection'
    | 'outstanding_balances'
    | 'course_enrollment'
  >('all_students');

  const [courseFilter, setCourseFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Excel-compatible UTF-8 CSV exporter
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    // Add UTF-8 BOM so Excel displays characters correctly
    const BOM = '\uFEFF';
    const csvContent =
      BOM +
      [
        headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
        ...rows.map((row) =>
          row
            .map((cell) => {
              const val = cell !== undefined && cell !== null ? String(cell) : '';
              return `"${val.replace(/"/g, '""')}"`;
            })
            .join(',')
        ),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Export All Student Applications
  const handleExportAllStudents = () => {
    const headers = [
      'Application ID',
      'Submission Date',
      'Full Name',
      'WhatsApp',
      'Email',
      'City',
      'Qualification',
      'Course Code',
      'Course Name',
      'Admission Status',
      'Scholarship Status',
      'Course Fee (PKR)',
      'Approved Discount (PKR)',
      'Final Payable Fee (PKR)',
      'Total Paid (PKR)',
      'Remaining Balance (PKR)',
      'Payment Status',
    ];

    const rows = students.map((s) => [
      s.application_id,
      new Date(s.created_at).toLocaleDateString('en-PK'),
      s.full_name,
      s.whatsapp,
      s.email,
      s.city || 'N/A',
      s.qualification || 'N/A',
      s.course_code || '',
      s.course_name || '',
      s.admission_status.toUpperCase(),
      s.scholarship_status || 'not_applied',
      s.original_fee_pkr || 0,
      s.approved_discount_pkr || 0,
      s.final_payable_fee_pkr || s.original_fee_pkr || 0,
      s.total_paid_pkr || 0,
      s.remaining_balance_pkr || 0,
      s.payment_status || 'Unpaid',
    ]);

    downloadCSV('Nexora_All_Student_Applications', headers, rows);
  };

  // 2. Export Approved Admissions
  const handleExportApproved = () => {
    const approved = students.filter((s) => s.admission_status === 'approved');
    const headers = [
      'Application ID',
      'Full Name',
      'WhatsApp',
      'Email',
      'Course',
      'Payable Fee (PKR)',
      'Amount Paid (PKR)',
      'Remaining Balance (PKR)',
      'Payment Status',
    ];
    const rows = approved.map((s) => [
      s.application_id,
      s.full_name,
      s.whatsapp,
      s.email,
      s.course_name || '',
      s.final_payable_fee_pkr || 0,
      s.total_paid_pkr || 0,
      s.remaining_balance_pkr || 0,
      s.payment_status || 'Unpaid',
    ]);
    downloadCSV('Nexora_Approved_Admissions', headers, rows);
  };

  // 3. Export Scholarship Report
  const handleExportScholarships = () => {
    const withScholarship = students.filter(
      (s) => s.scholarship_status && s.scholarship_status !== 'not_applied'
    );
    const headers = [
      'Application ID',
      'Student Name',
      'WhatsApp',
      'Course',
      'Category',
      'Status',
      'Original Fee (PKR)',
      'Approved Discount (PKR)',
      'Final Payable (PKR)',
      'Reason',
    ];
    const rows = withScholarship.map((s) => [
      s.application_id,
      s.full_name,
      s.whatsapp,
      s.course_name || '',
      s.scholarship_category || 'N/A',
      s.scholarship_status || 'pending',
      s.original_fee_pkr || 0,
      s.approved_discount_pkr || 0,
      s.final_payable_fee_pkr || 0,
      s.scholarship_reason || '',
    ]);
    downloadCSV('Nexora_Scholarship_Applications', headers, rows);
  };

  // 4. Export Payments / Cash Register Report
  const handleExportPayments = () => {
    const filteredPayments = payments.filter((p) => {
      const matchMethod = methodFilter === 'ALL' || p.payment_method === methodFilter;
      return matchMethod;
    });

    const headers = [
      'Receipt Number',
      'Date',
      'Student Name',
      'Application ID',
      'Course Enrolled',
      'Payment Method',
      'Amount Received (PKR)',
      'Received By',
      'Reference',
      'Notes',
    ];

    const rows = filteredPayments.map((p) => {
      const student = students.find((s) => s.id === p.student_id);
      return [
        p.receipt_number,
        p.payment_date,
        student?.full_name || 'N/A',
        student?.application_id || 'N/A',
        student?.course_name || 'N/A',
        p.payment_method,
        p.amount_paid_pkr,
        p.received_by,
        p.payment_reference || '',
        p.notes || '',
      ];
    });

    downloadCSV('Nexora_Fee_Payment_Collections', headers, rows);
  };

  // 5. Export Outstanding Balance Report
  const handleExportOutstanding = () => {
    const withBalance = students.filter((s) => (s.remaining_balance_pkr || 0) > 0);
    const headers = [
      'Application ID',
      'Student Name',
      'WhatsApp',
      'Email',
      'Course',
      'Total Payable (PKR)',
      'Paid So Far (PKR)',
      'Outstanding Balance (PKR)',
      'Payment Status',
    ];
    const rows = withBalance.map((s) => [
      s.application_id,
      s.full_name,
      s.whatsapp,
      s.email,
      s.course_name || '',
      s.final_payable_fee_pkr || 0,
      s.total_paid_pkr || 0,
      s.remaining_balance_pkr || 0,
      s.payment_status || 'Unpaid',
    ]);
    downloadCSV('Nexora_Outstanding_Fee_Balances', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" /> Financial & Admissions Analytics Reports
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate and export Excel-compatible UTF-8 CSV reports for auditors, management, and treasury.
          </p>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'all_students', label: 'All Applications', icon: Users, count: students.length },
          {
            id: 'approved_admissions',
            label: 'Approved Admissions',
            icon: CheckCircle,
            count: metrics.approvedAdmissions,
          },
          {
            id: 'scholarships',
            label: 'Scholarship Review',
            icon: Award,
            count: metrics.scholarshipApplications,
          },
          {
            id: 'cash_collection',
            label: 'Fee & Cash Collections',
            icon: DollarSign,
            count: payments.length,
          },
          {
            id: 'outstanding_balances',
            label: 'Outstanding Balances',
            icon: TrendingUp,
            count: students.filter((s) => (s.remaining_balance_pkr || 0) > 0).length,
          },
          {
            id: 'course_enrollment',
            label: 'Course-Wise Enrollment',
            icon: BookOpen,
            count: courses.length,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
        {/* ALL APPLICATIONS REPORT */}
        {activeReportTab === 'all_students' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Complete Student Admission Register
                </h3>
                <p className="text-xs text-slate-500">
                  Total of {students.length} recorded applicants across all courses.
                </p>
              </div>
              <button
                onClick={handleExportAllStudents}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" /> Export CSV (Excel)
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">App ID</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3">Program</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Payable (PKR)</th>
                    <th className="py-2.5 px-3 text-right">Balance (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.slice(0, 10).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-semibold text-indigo-600">
                        {s.application_id}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{s.full_name}</td>
                      <td className="py-2 px-3 text-slate-500">{s.whatsapp}</td>
                      <td className="py-2 px-3 text-slate-700">{s.course_code}</td>
                      <td className="py-2 px-3">
                        <span className="capitalize font-semibold">{s.admission_status}</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        Rs. {(s.final_payable_fee_pkr || s.original_fee_pkr || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                        Rs. {(s.remaining_balance_pkr || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CASH & FEE COLLECTION REPORT */}
        {activeReportTab === 'cash_collection' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Fee Collection & Payment Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Total Confirmed Collections: <strong>PKR {metrics.totalConfirmedCollection.toLocaleString()}</strong> (Cash: PKR {metrics.totalCashCollection.toLocaleString()})
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                >
                  <option value="ALL">All Methods</option>
                  <option value="Cash">Cash Only</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Online Payment">Online Payment</option>
                </select>

                <button
                  onClick={handleExportPayments}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Receipt #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3 text-right">Amount Received</th>
                    <th className="py-2.5 px-3">Received By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments
                    .filter((p) => methodFilter === 'ALL' || p.payment_method === methodFilter)
                    .map((p) => {
                      const student = students.find((s) => s.id === p.student_id);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-indigo-700">
                            {p.receipt_number}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{p.payment_date}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {student?.full_name || 'N/A'}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                              {p.payment_method}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-extrabold text-emerald-700">
                            Rs. {p.amount_paid_pkr.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-slate-600 font-medium">{p.received_by}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* OUTSTANDING BALANCES REPORT */}
        {activeReportTab === 'outstanding_balances' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Outstanding Tuition Balances
                </h3>
                <p className="text-xs text-rose-600 font-semibold">
                  Total Outstanding Across All Enrolled: PKR {metrics.totalOutstandingBalance.toLocaleString()}
                </p>
              </div>
              <button
                onClick={handleExportOutstanding}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">App ID</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">WhatsApp</th>
                    <th className="py-2.5 px-3">Program</th>
                    <th className="py-2.5 px-3 text-right">Payable</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-3 text-right">Outstanding Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students
                    .filter((s) => (s.remaining_balance_pkr || 0) > 0)
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-semibold text-indigo-600">
                          {s.application_id}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{s.full_name}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{s.whatsapp}</td>
                        <td className="py-2 px-3 text-slate-700">{s.course_code}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700">
                          Rs. {(s.final_payable_fee_pkr || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-700">
                          Rs. {(s.total_paid_pkr || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-extrabold text-rose-600">
                          Rs. {(s.remaining_balance_pkr || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SCHOLARSHIPS REPORT */}
        {activeReportTab === 'scholarships' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Scholarship Applications & Concession Register
                </h3>
                <p className="text-xs text-slate-500">
                  Total Applications: {metrics.scholarshipApplications} • Approved: {metrics.approvedScholarships}
                </p>
              </div>
              <button
                onClick={handleExportScholarships}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">App ID</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Program</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Discount (PKR)</th>
                    <th className="py-2.5 px-3 text-right">Final Fee (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students
                    .filter((s) => s.scholarship_status && s.scholarship_status !== 'not_applied')
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-semibold text-indigo-600">
                          {s.application_id}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{s.full_name}</td>
                        <td className="py-2 px-3 text-slate-700">{s.course_code}</td>
                        <td className="py-2 px-3 text-amber-800 font-medium">
                          {s.scholarship_category || 'N/A'}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              s.scholarship_status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : s.scholarship_status === 'rejected'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {s.scholarship_status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                          Rs. {(s.approved_discount_pkr || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          Rs. {(s.final_payable_fee_pkr || s.original_fee_pkr || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COURSE ENROLLMENT REPORT */}
        {activeReportTab === 'course_enrollment' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Course-Wise Enrollment Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((c) => {
                const count = students.filter(
                  (s) => s.course_id === c.id && s.admission_status !== 'archived'
                ).length;
                const approvedCount = students.filter(
                  (s) => s.course_id === c.id && s.admission_status === 'approved'
                ).length;
                const totalCourseRevenue = students
                  .filter((s) => s.course_id === c.id && s.admission_status === 'approved')
                  .reduce((acc, curr) => acc + (curr.total_paid_pkr || 0), 0);

                return (
                  <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {c.code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-2 mb-1">{c.name}</h4>
                    <p className="text-xs text-slate-500 mb-3">Duration: {c.duration} • Fee: PKR {c.fee_pkr.toLocaleString()}</p>
                    <div className="text-xs space-y-1 border-t border-slate-200 pt-2 font-medium">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Applicants:</span>
                        <span className="font-bold text-slate-800">{count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Approved Seats:</span>
                        <span className="font-bold text-emerald-700">{approvedCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Collected Revenue:</span>
                        <span className="font-mono font-bold text-indigo-900">
                          Rs. {totalCourseRevenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
