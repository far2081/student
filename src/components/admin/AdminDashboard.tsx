import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, AdmissionStatus, ScholarshipStatus } from '../../types';
import { CourseManagement } from './CourseManagement';
import { FeeManagement } from './FeeManagement';
import { ReportsView } from './ReportsView';
import { NexoraLogo } from '../common/NexoraLogo';
import {
  Users,
  CheckCircle,
  Clock,
  BookOpen,
  Sparkles,
  DollarSign,
  TrendingUp,
  Banknote,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
  Check,
  X,
  CreditCard,
  LogOut,
  RefreshCw,
  FileSpreadsheet,
  ShieldCheck,
  Award,
  Layers,
  ChevronRight,
  Eye,
  ExternalLink,
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
  onGoToPublicForm: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  onGoToPublicForm,
}) => {
  const {
    students,
    courses,
    payments,
    auditLogs,
    adminUser,
    metrics,
    isSupabaseLive,
    refreshData,
    updateStudentStatus,
    reviewScholarship,
    deleteStudent,
    archiveStudent,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'students' | 'courses' | 'fees' | 'reports' | 'audit'
  >('overview');

  // Search & Filter state for Student Table
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [scholarshipFilter, setScholarshipFilter] = useState('ALL');

  // Student Profile & Review Modal State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [scholarshipDiscountInput, setScholarshipDiscountInput] = useState<number>(0);
  const [scholarshipAdminNotes, setScholarshipAdminNotes] = useState<string>('');

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (s.admission_status === 'archived' && statusFilter !== 'archived') return false;

    const matchesSearch =
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.application_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.whatsapp.includes(searchTerm) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || s.admission_status === statusFilter;

    const matchesCourse =
      courseFilter === 'ALL' || s.course_id === courseFilter;

    const matchesScholarship =
      scholarshipFilter === 'ALL' ||
      (s.scholarship_status || 'not_applied') === scholarshipFilter;

    return matchesSearch && matchesStatus && matchesCourse && matchesScholarship;
  });

  const handleOpenStudentReview = (student: Student) => {
    setSelectedStudent(student);
    setScholarshipDiscountInput(student.approved_discount_pkr || 0);
    setScholarshipAdminNotes('');
    setIsReviewModalOpen(true);
  };

  const handleApproveAdmission = async (studentId: string) => {
    await updateStudentStatus(studentId, 'approved');
    if (selectedStudent && selectedStudent.id === studentId) {
      setSelectedStudent({ ...selectedStudent, admission_status: 'approved' });
    }
  };

  const handleRejectAdmission = async (studentId: string) => {
    await updateStudentStatus(studentId, 'rejected');
    if (selectedStudent && selectedStudent.id === studentId) {
      setSelectedStudent({ ...selectedStudent, admission_status: 'rejected' });
    }
  };

  const handleSaveScholarshipDecision = async (
    status: ScholarshipStatus,
    discount: number
  ) => {
    if (!selectedStudent) return;
    await reviewScholarship(selectedStudent.id, status, discount, scholarshipAdminNotes);
    setIsReviewModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Admin Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <NexoraLogo size="sm" />
            <div className="hidden sm:block h-6 w-px bg-slate-200" />
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Administrative Console
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Database Status Indicator */}
            <div
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                isSupabaseLive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              {isSupabaseLive ? 'Supabase Live' : 'Local Persistent Storage'}
            </div>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
              title="Sync & Refresh Database"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* View Public Form Shortcut */}
            <button
              onClick={onGoToPublicForm}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Public Admission Form
            </button>

            {/* Admin Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <span className="block text-xs font-bold text-slate-900 leading-tight">
                  {adminUser?.full_name || 'Farhana Aamir'}
                </span>
                <span className="text-[10px] text-slate-400 capitalize">{adminUser?.role || 'Superadmin'}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-1 border-t border-slate-100">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: Layers },
            { id: 'students', label: 'Student Applications', icon: Users, badge: metrics.newApplications },
            { id: 'courses', label: 'Course Management', icon: BookOpen },
            { id: 'fees', label: 'Cash & Fee Registry', icon: Banknote },
            { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
            { id: 'audit', label: 'Audit Trail', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold tracking-tight border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-600 text-white font-extrabold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW DASHBOARD (THE 9 REAL METRIC KPI CARDS)        */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Admissions & Financial Summary
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Real-time metrics calculated from confirmed applications, approved scholarships, and treasury collections.
              </p>
            </div>

            {/* 9 Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* 1. Total Applications */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total Applications
                  </span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">
                    {metrics.totalApplications}
                  </p>
                  <span className="text-[11px] text-slate-500">All registered candidates</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              {/* 2. New / Pending Applications */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    New Applications
                  </span>
                  <p className="text-2xl font-extrabold text-amber-600 mt-1">
                    {metrics.newApplications}
                  </p>
                  <span className="text-[11px] text-amber-700">Awaiting admission review</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              {/* 3. Approved Admissions */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Approved Admissions
                  </span>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                    {metrics.approvedAdmissions}
                  </p>
                  <span className="text-[11px] text-emerald-700">Official active students</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>

              {/* 4. Active Courses */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Active Programs
                  </span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">
                    {metrics.activeCourses}
                  </p>
                  <span className="text-[11px] text-slate-500">Published in public form</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>

              {/* 5. Scholarship Applications */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Scholarship Requests
                  </span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">
                    {metrics.scholarshipApplications}
                  </p>
                  <span className="text-[11px] text-slate-500">Need & merit applicants</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
              </div>

              {/* 6. Approved Scholarships */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Approved Scholarships
                  </span>
                  <p className="text-2xl font-extrabold text-indigo-600 mt-1">
                    {metrics.approvedScholarships}
                  </p>
                  <span className="text-[11px] text-indigo-700">Granted fee concessions</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>

              {/* 7. Total Confirmed Fee Collection */}
              <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between bg-gradient-to-br from-white to-emerald-50/30">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Total Confirmed Collections
                  </span>
                  <p className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
                    PKR {metrics.totalConfirmedCollection.toLocaleString()}
                  </p>
                  <span className="text-[11px] text-emerald-600">All verified payment methods</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              {/* 8. Total Cash Collection */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total Cash Collections
                  </span>
                  <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                    PKR {metrics.totalCashCollection.toLocaleString()}
                  </p>
                  <span className="text-[11px] text-slate-500">Physically confirmed in treasury</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Banknote className="w-6 h-6" />
                </div>
              </div>

              {/* 9. Outstanding Fee Balance */}
              <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm flex items-center justify-between bg-gradient-to-br from-white to-rose-50/30">
                <div>
                  <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                    Outstanding Fee Balance
                  </span>
                  <p className="text-2xl font-extrabold text-rose-700 font-mono mt-1">
                    PKR {metrics.totalOutstandingBalance.toLocaleString()}
                  </p>
                  <span className="text-[11px] text-rose-600">Receivable from approved students</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Applications Table Preview */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <h3 className="text-base font-bold text-slate-900">Recent Student Inquiries</h3>
                <button
                  onClick={() => setActiveTab('students')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                >
                  View All Registrations <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">App ID</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Program</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Admission</th>
                      <th className="py-2.5 px-3">Scholarship</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {students.slice(0, 5).map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">
                          {s.application_id}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{s.full_name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{s.course_code}</td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {new Date(s.created_at).toLocaleDateString('en-PK')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              s.admission_status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : s.admission_status === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {s.admission_status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[11px] text-slate-600 capitalize">
                            {s.scholarship_status || 'not applied'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleOpenStudentReview(s)}
                            className="p-1 rounded text-indigo-600 hover:bg-indigo-50"
                            title="Review Student"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: SEARCHABLE & FILTERABLE STUDENT APPLICATIONS TABLE     */}
        {/* ============================================================== */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> Student Admission Applications
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Filter, search, review profiles, approve scholarships, and record fee collections.
              </p>
            </div>

            {/* Multi-Search & Filter Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, App ID, WhatsApp, email..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                >
                  <option value="ALL">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                >
                  <option value="ALL">All Admission Statuses</option>
                  <option value="pending">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="archived">Archived</option>
                </select>

                <select
                  value={scholarshipFilter}
                  onChange={(e) => setScholarshipFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                >
                  <option value="ALL">All Scholarships</option>
                  <option value="pending">Scholarship Pending</option>
                  <option value="approved">Scholarship Approved</option>
                  <option value="not_applied">No Scholarship</option>
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-3">App ID</th>
                      <th className="py-3 px-3">Student</th>
                      <th className="py-3 px-3">Course</th>
                      <th className="py-3 px-3">Admission</th>
                      <th className="py-3 px-3">Scholarship</th>
                      <th className="py-3 px-3 text-right">Payable (PKR)</th>
                      <th className="py-3 px-3 text-right">Balance (PKR)</th>
                      <th className="py-3 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          No student records found matching the active filters.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => {
                        const finalPayable = s.final_payable_fee_pkr || s.original_fee_pkr || 0;
                        const balance = s.remaining_balance_pkr !== undefined ? s.remaining_balance_pkr : Math.max(0, finalPayable - (s.total_paid_pkr || 0));

                        return (
                          <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-indigo-600">
                              {s.application_id}
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={s.photo_url}
                                  alt=""
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                                />
                                <div>
                                  <p className="font-bold text-slate-900">{s.full_name}</p>
                                  <span className="text-[11px] text-slate-400 font-mono">{s.whatsapp}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-800">{s.course_code}</span>
                            </td>

                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  s.admission_status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : s.admission_status === 'rejected'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {s.admission_status}
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  s.scholarship_status === 'approved'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : s.scholarship_status === 'pending'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'text-slate-400'
                                }`}
                              >
                                {s.scholarship_status || 'not applied'}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                              Rs. {finalPayable.toLocaleString()}
                            </td>

                            <td className="py-3 px-3 text-right font-mono font-extrabold">
                              <span className={balance === 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                Rs. {balance.toLocaleString()}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleOpenStudentReview(s)}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                                >
                                  Review
                                </button>
                                <button
                                  onClick={() => deleteStudent(s.id)}
                                  className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
          </div>
        )}

        {/* TAB 3: COURSE MANAGEMENT */}
        {activeTab === 'courses' && <CourseManagement />}

        {/* TAB 4: CASH & FEE REGISTRY */}
        {activeTab === 'fees' && <FeeManagement />}

        {/* TAB 5: REPORTS & EXPORT */}
        {activeTab === 'reports' && <ReportsView />}

        {/* TAB 6: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" /> Administrative Audit Trail
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Entity: {log.entity} • Ref: <span className="font-mono">{log.entity_id}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-700">{log.performed_by}</span>
                    <p className="text-[10px] text-slate-400">
                      {new Date(log.created_at).toLocaleString('en-PK')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* STUDENT PROFILE & REVIEW MODAL */}
      {isReviewModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStudent.photo_url}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedStudent.full_name}</h3>
                  <span className="font-mono text-xs font-semibold text-indigo-600">
                    {selectedStudent.application_id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Information */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Contact Details</span>
                <p className="font-semibold text-slate-800">{selectedStudent.email}</p>
                <p className="font-mono text-slate-600">{selectedStudent.whatsapp}</p>
                {selectedStudent.city && <p className="text-slate-500">City: {selectedStudent.city}</p>}
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Program</span>
                <p className="font-bold text-slate-900">{selectedStudent.course_name}</p>
                <p className="text-slate-600">Duration: {selectedStudent.course_duration}</p>
                <p className="text-slate-600 font-mono">
                  Base Fee: Rs. {(selectedStudent.original_fee_pkr || 0).toLocaleString()} PKR
                </p>
              </div>

              {selectedStudent.qualification && (
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Academic Background</span>
                  <p className="text-slate-700 font-medium">{selectedStudent.qualification}</p>
                </div>
              )}

              {selectedStudent.notes && (
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Applicant Notes</span>
                  <p className="text-slate-600 italic">{selectedStudent.notes}</p>
                </div>
              )}
            </div>

            {/* Scholarship Review Section */}
            {selectedStudent.scholarship_status && selectedStudent.scholarship_status !== 'not_applied' && (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 mb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Scholarship Evaluation
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900">
                    Status: {selectedStudent.scholarship_status}
                  </span>
                </div>

                <div className="text-xs text-slate-700 space-y-1">
                  <p>
                    Category: <strong>{selectedStudent.scholarship_category}</strong>
                  </p>
                  <p>Statement / Reason: {selectedStudent.scholarship_reason}</p>
                  {selectedStudent.scholarship_doc_url && (
                    <p>
                      <a
                        href={selectedStudent.scholarship_doc_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 underline font-semibold"
                      >
                        View Attached Supporting Document
                      </a>
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-amber-200 flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex-1 w-full">
                    <label className="block text-[11px] font-bold text-amber-950 uppercase mb-1">
                      Approved Discount Amount (PKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={selectedStudent.original_fee_pkr || 50000}
                      step="500"
                      value={scholarshipDiscountInput}
                      onChange={(e) => setScholarshipDiscountInput(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-amber-300 text-xs font-mono font-bold bg-white"
                    />
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto pt-4 sm:pt-0">
                    <button
                      onClick={() => handleSaveScholarshipDecision('approved', scholarshipDiscountInput)}
                      className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      Approve Discount
                    </button>
                    <button
                      onClick={() => handleSaveScholarshipDecision('rejected', 0)}
                      className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold"
                    >
                      Reject Scholarship
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Admission Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Current Status: <strong className="capitalize">{selectedStudent.admission_status}</strong>
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => handleRejectAdmission(selectedStudent.id)}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                >
                  Reject Admission
                </button>
                <button
                  onClick={() => handleApproveAdmission(selectedStudent.id)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  Approve Admission
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
