import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Student,
  Course,
  Payment,
  AuditLog,
  AdminProfile,
  DashboardMetrics,
  AdmissionStatus,
  ScholarshipStatus,
  PaymentMethod,
} from '../types';
import {
  supabase,
  isSupabaseConfigured,
  INITIAL_COURSES,
  INITIAL_STUDENTS,
  INITIAL_PAYMENTS,
  INITIAL_AUDIT_LOGS,
} from '../lib/supabase';

export interface AdmissionFormData {
  fullName: string;
  whatsapp: string;
  email: string;
  city?: string;
  qualification?: string;
  notes?: string;
  photoUrl: string;
  courseId: string;
  isApplyingScholarship: boolean;
  scholarshipCategory?: string;
  scholarshipReason?: string;
  scholarshipDocUrl?: string;
  privacyConsent: boolean;
}

export interface AppContextType {
  courses: Course[];
  students: Student[];
  payments: Payment[];
  auditLogs: AuditLog[];
  adminUser: AdminProfile | null;
  isAdminLoggedIn: boolean;
  isSupabaseLive: boolean;
  isLoading: boolean;
  metrics: DashboardMetrics;
  // Student Actions
  submitAdmissionForm: (data: AdmissionFormData) => Promise<{ success: boolean; applicationId?: string; error?: string }>;
  verifyStudentApplication: (appId: string, phoneOrEmail: string) => Promise<Student | null>;
  // Admin Student Management
  updateStudentStatus: (studentId: string, status: AdmissionStatus) => Promise<boolean>;
  reviewScholarship: (studentId: string, status: ScholarshipStatus, discountPkr: number, adminNotes?: string) => Promise<boolean>;
  assignCourseToStudent: (studentId: string, courseId: string, customFeePkr?: number) => Promise<boolean>;
  deleteStudent: (studentId: string) => Promise<boolean>;
  archiveStudent: (studentId: string) => Promise<boolean>;
  // Payment Actions
  recordPayment: (paymentData: {
    studentId: string;
    amountPaidPkr: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    paymentReference?: string;
    receivedBy: string;
    notes?: string;
    isConfirmed: boolean;
  }) => Promise<{ success: boolean; receiptNumber?: string; payment?: Payment; error?: string }>;
  // Course Management
  addCourse: (course: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateCourse: (courseId: string, updates: Partial<Course>) => Promise<boolean>;
  toggleCourseStatus: (courseId: string) => Promise<boolean>;
  deleteCourse: (courseId: string) => Promise<{ success: boolean; error?: string }>;
  // Auth
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  COURSES: 'nexora_courses_v1',
  STUDENTS: 'nexora_students_v1',
  PAYMENTS: 'nexora_payments_v1',
  AUDIT: 'nexora_audit_v1',
  ADMIN_SESSION: 'nexora_admin_session_v1',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.COURSES);
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.STUDENTS);
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.PAYMENTS);
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.AUDIT);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [adminUser, setAdminUser] = useState<AdminProfile | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.ADMIN_SESSION);
    return saved ? JSON.parse(saved) : null;
  });

  const [isSupabaseLive, setIsSupabaseLive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.COURSES, JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    if (adminUser) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(adminUser));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.ADMIN_SESSION);
    }
  }, [adminUser]);

  // Test Supabase connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isSupabaseConfigured() || !supabase) {
        setIsSupabaseLive(false);
        return;
      }
      try {
        const { error } = await supabase.from('courses').select('id').limit(1);
        if (!error) {
          setIsSupabaseLive(true);
          await loadFromSupabase();
        } else {
          setIsSupabaseLive(false);
        }
      } catch {
        setIsSupabaseLive(false);
      }
    };
    checkConnection();
  }, []);

  const loadFromSupabase = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data: dbCourses } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (dbCourses && dbCourses.length > 0) {
        setCourses(dbCourses);
      }

      const { data: dbStudents } = await supabase.from('students').select(`
        *,
        enrollments (
          course_id,
          original_course_fee_pkr,
          approved_discount_pkr,
          final_payable_fee_pkr,
          courses ( name, code, duration )
        ),
        scholarship_applications (
          status,
          category,
          reason,
          discount_amount_pkr
        )
      `).order('created_at', { ascending: false });

      if (dbStudents && dbStudents.length > 0) {
        // Map to composite student representation
        const mappedStudents: Student[] = dbStudents.map((s: any) => {
          const enr = s.enrollments?.[0];
          const course = enr?.courses;
          const sch = s.scholarship_applications?.[0];
          return {
            id: s.id,
            application_id: s.application_id,
            full_name: s.full_name,
            whatsapp: s.whatsapp,
            email: s.email,
            city: s.city,
            qualification: s.qualification,
            notes: s.notes,
            photo_url: s.photo_url,
            privacy_consent: s.privacy_consent,
            admission_status: s.admission_status,
            created_at: s.created_at,
            course_id: enr?.course_id,
            course_name: course?.name,
            course_code: course?.code,
            course_duration: course?.duration,
            original_fee_pkr: enr ? Number(enr.original_course_fee_pkr) : 0,
            approved_discount_pkr: enr ? Number(enr.approved_discount_pkr) : 0,
            final_payable_fee_pkr: enr ? Number(enr.final_payable_fee_pkr) : 0,
            scholarship_status: sch?.status || 'not_applied',
            scholarship_category: sch?.category,
            scholarship_reason: sch?.reason,
          };
        });
        setStudents(mappedStudents);
      }

      const { data: dbPayments } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
      if (dbPayments) {
        setPayments(dbPayments.map((p: any) => ({
          ...p,
          amount_paid_pkr: Number(p.amount_paid_pkr),
        })));
      }
    } catch (err) {
      console.error('Error fetching Supabase records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    if (isSupabaseLive && supabase) {
      await loadFromSupabase();
    }
  };

  // Real-time calculated dashboard metrics from actual data
  const metrics = useMemo<DashboardMetrics>(() => {
    const totalApplications = students.filter((s) => s.admission_status !== 'archived').length;
    const newApplications = students.filter((s) => s.admission_status === 'pending').length;
    const approvedAdmissions = students.filter((s) => s.admission_status === 'approved').length;
    const activeCourses = courses.filter((c) => c.is_active).length;

    const scholarshipApplications = students.filter(
      (s) => s.scholarship_status && s.scholarship_status !== 'not_applied'
    ).length;

    const approvedScholarships = students.filter(
      (s) => s.scholarship_status === 'approved'
    ).length;

    // Confirmed Fee Collections from verified payments
    const confirmedPayments = payments.filter((p) => p.is_confirmed);
    const totalConfirmedCollection = confirmedPayments.reduce(
      (sum, p) => sum + Number(p.amount_paid_pkr || 0),
      0
    );

    const totalCashCollection = confirmedPayments
      .filter((p) => p.payment_method === 'Cash')
      .reduce((sum, p) => sum + Number(p.amount_paid_pkr || 0), 0);

    // Outstanding Balance = Total Final Payable for approved students - Confirmed Payments
    const totalPayableApproved = students
      .filter((s) => s.admission_status === 'approved')
      .reduce((sum, s) => sum + Number(s.final_payable_fee_pkr || s.original_fee_pkr || 0), 0);

    const totalOutstandingBalance = Math.max(0, totalPayableApproved - totalConfirmedCollection);

    return {
      totalApplications,
      newApplications,
      approvedAdmissions,
      activeCourses,
      scholarshipApplications,
      approvedScholarships,
      totalConfirmedCollection,
      totalCashCollection,
      totalOutstandingBalance,
    };
  }, [students, courses, payments]);

  // Submit Admission Form
  const submitAdmissionForm = async (
    data: AdmissionFormData
  ): Promise<{ success: boolean; applicationId?: string; error?: string }> => {
    try {
      // 1. Validation: Prevent duplicate submissions by email or whatsapp in same course
      const existing = students.find(
        (s) =>
          (s.email.toLowerCase() === data.email.toLowerCase() ||
            s.whatsapp.replace(/\D/g, '') === data.whatsapp.replace(/\D/g, '')) &&
          s.course_id === data.courseId &&
          s.admission_status !== 'rejected' &&
          s.admission_status !== 'archived'
      );

      if (existing) {
        return {
          success: false,
          error: `An active application (${existing.application_id}) already exists for this email/phone in this course.`,
        };
      }

      const selectedCourse = courses.find((c) => c.id === data.courseId);
      if (!selectedCourse) {
        return { success: false, error: 'Selected course not found or inactive.' };
      }

      // Generate unique Application ID: NX-YYMM-XXXX
      const datePart = new Date().toISOString().slice(2, 7).replace('-', '');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const applicationId = `NX-${datePart}-${randomPart}`;

      const newStudentId = `std-${Date.now()}`;
      const originalFee = selectedCourse.fee_pkr;
      const initialDiscount = 0; // Student CANNOT approve their own scholarship!
      const initialFinalFee = originalFee;

      const newStudent: Student = {
        id: newStudentId,
        application_id: applicationId,
        full_name: data.fullName.trim(),
        whatsapp: data.whatsapp.trim(),
        email: data.email.trim(),
        city: data.city?.trim() || undefined,
        qualification: data.qualification?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        photo_url: data.photoUrl,
        privacy_consent: data.privacyConsent,
        admission_status: 'pending',
        created_at: new Date().toISOString(),
        course_id: selectedCourse.id,
        course_name: selectedCourse.name,
        course_code: selectedCourse.code,
        course_duration: selectedCourse.duration,
        original_fee_pkr: originalFee,
        approved_discount_pkr: initialDiscount,
        final_payable_fee_pkr: initialFinalFee,
        scholarship_status: data.isApplyingScholarship ? 'pending' : 'not_applied',
        scholarship_category: data.isApplyingScholarship ? data.scholarshipCategory : undefined,
        scholarship_reason: data.isApplyingScholarship ? data.scholarshipReason : undefined,
        scholarship_doc_url: data.isApplyingScholarship ? data.scholarshipDocUrl : undefined,
        total_paid_pkr: 0,
        remaining_balance_pkr: initialFinalFee,
        payment_status: 'Unpaid',
      };

      // If Supabase is connected, insert to remote DB
      if (isSupabaseLive && supabase) {
        const { data: insertedStudent, error: sError } = await supabase
          .from('students')
          .insert({
            application_id: applicationId,
            full_name: newStudent.full_name,
            whatsapp: newStudent.whatsapp,
            email: newStudent.email,
            city: newStudent.city,
            qualification: newStudent.qualification,
            notes: newStudent.notes,
            photo_url: newStudent.photo_url,
            privacy_consent: newStudent.privacy_consent,
            admission_status: 'pending',
          })
          .select()
          .single();

        if (sError) throw sError;

        if (insertedStudent) {
          // Insert enrollment
          await supabase.from('enrollments').insert({
            student_id: insertedStudent.id,
            course_id: selectedCourse.id,
            original_course_fee_pkr: originalFee,
            approved_discount_pkr: 0,
          });

          // Insert scholarship if requested
          if (data.isApplyingScholarship) {
            await supabase.from('scholarship_applications').insert({
              student_id: insertedStudent.id,
              is_applying: true,
              category: data.scholarshipCategory,
              reason: data.scholarshipReason,
              document_url: data.scholarshipDocUrl,
              status: 'pending',
              discount_amount_pkr: 0,
            });
          }
          newStudent.id = insertedStudent.id;
        }
      }

      setStudents((prev) => [newStudent, ...prev]);

      // Add audit log
      const audit: AuditLog = {
        id: `log-${Date.now()}`,
        action: 'Student Application Submitted',
        entity: 'Student',
        entity_id: applicationId,
        details: { course: selectedCourse.name, scholarship: data.isApplyingScholarship },
        performed_by: 'Public Applicant',
        created_at: new Date().toISOString(),
      };
      setAuditLogs((prev) => [audit, ...prev]);

      return { success: true, applicationId };
    } catch (err: any) {
      console.error('Admission submission error:', err);
      return { success: false, error: err.message || 'Submission failed. Please check inputs and try again.' };
    }
  };

  // Secure identity verification for application status lookup
  const verifyStudentApplication = async (
    appId: string,
    phoneOrEmail: string
  ): Promise<Student | null> => {
    const cleanAppId = appId.trim().toLowerCase();
    const cleanLookup = phoneOrEmail.trim().toLowerCase();
    const cleanDigits = phoneOrEmail.replace(/\D/g, '');

    const found = students.find((s) => {
      const matchId = s.application_id.toLowerCase() === cleanAppId;
      const matchEmail = s.email.toLowerCase() === cleanLookup;
      const sDigits = s.whatsapp.replace(/\D/g, '');
      const matchPhone = sDigits.length > 6 && cleanDigits.length > 6 && (sDigits.includes(cleanDigits) || cleanDigits.includes(sDigits));
      return matchId && (matchEmail || matchPhone);
    });

    if (!found) return null;

    // Return sanitized student record (no internal admin notes or other records)
    return {
      ...found,
      notes: undefined, // internal notes protected
    };
  };

  // Admin: Update Admission Status
  const updateStudentStatus = async (studentId: string, status: AdmissionStatus): Promise<boolean> => {
    try {
      if (isSupabaseLive && supabase) {
        const { error } = await supabase
          .from('students')
          .update({ admission_status: status })
          .eq('id', studentId);
        if (error) throw error;
      }

      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, admission_status: status } : s))
      );

      const log: AuditLog = {
        id: `log-${Date.now()}`,
        action: `Admission Status Changed to ${status.toUpperCase()}`,
        entity: 'Student',
        entity_id: studentId,
        performed_by: adminUser?.full_name || 'Admin',
        created_at: new Date().toISOString(),
      };
      setAuditLogs((prev) => [log, ...prev]);

      return true;
    } catch (err) {
      console.error('Failed to update student admission status:', err);
      return false;
    }
  };

  // Admin: Review Scholarship (Approve/Reject + custom discount PKR)
  const reviewScholarship = async (
    studentId: string,
    status: ScholarshipStatus,
    discountPkr: number,
    adminNotes?: string
  ): Promise<boolean> => {
    try {
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id !== studentId) return s;

          const originalFee = s.original_fee_pkr || 0;
          const approvedDiscount = status === 'approved' ? Math.min(originalFee, Math.max(0, discountPkr)) : 0;
          const finalPayable = Math.max(0, originalFee - approvedDiscount);
          const totalPaid = s.total_paid_pkr || 0;
          const remainingBalance = Math.max(0, finalPayable - totalPaid);

          let paymentStatus: PaymentMethod | any = 'Unpaid';
          if (totalPaid >= finalPayable && finalPayable > 0) {
            paymentStatus = 'Paid';
          } else if (totalPaid > 0) {
            paymentStatus = 'Partially Paid';
          }

          return {
            ...s,
            scholarship_status: status,
            approved_discount_pkr: approvedDiscount,
            final_payable_fee_pkr: finalPayable,
            remaining_balance_pkr: remainingBalance,
            payment_status: paymentStatus,
            notes: adminNotes ? `${s.notes || ''}\n[Scholarship Note]: ${adminNotes}` : s.notes,
          };
        })
      );

      const log: AuditLog = {
        id: `log-${Date.now()}`,
        action: `Scholarship ${status.toUpperCase()} (Discount: Rs. ${discountPkr.toLocaleString()})`,
        entity: 'Scholarship',
        entity_id: studentId,
        details: { status, discountPkr, adminNotes },
        performed_by: adminUser?.full_name || 'Admin',
        created_at: new Date().toISOString(),
      };
      setAuditLogs((prev) => [log, ...prev]);

      return true;
    } catch (err) {
      console.error('Error reviewing scholarship:', err);
      return false;
    }
  };

  // Admin: Assign / Change Course
  const assignCourseToStudent = async (
    studentId: string,
    courseId: string,
    customFeePkr?: number
  ): Promise<boolean> => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return false;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const fee = customFeePkr !== undefined ? customFeePkr : course.fee_pkr;
        const discount = s.scholarship_status === 'approved' ? s.approved_discount_pkr || 0 : 0;
        const finalPayable = Math.max(0, fee - discount);
        const paid = s.total_paid_pkr || 0;
        const remaining = Math.max(0, finalPayable - paid);

        return {
          ...s,
          course_id: course.id,
          course_name: course.name,
          course_code: course.code,
          course_duration: course.duration,
          original_fee_pkr: fee,
          final_payable_fee_pkr: finalPayable,
          remaining_balance_pkr: remaining,
        };
      })
    );

    return true;
  };

  // Admin: Delete Student Record
  const deleteStudent = async (studentId: string): Promise<boolean> => {
    if (isSupabaseLive && supabase) {
      await supabase.from('students').delete().eq('id', studentId);
    }
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setPayments((prev) => prev.filter((p) => p.student_id !== studentId));
    return true;
  };

  // Admin: Archive Student Record
  const archiveStudent = async (studentId: string): Promise<boolean> => {
    return updateStudentStatus(studentId, 'archived');
  };

  // Record Payment (Cash, Bank Transfer, Online)
  const recordPayment = async (data: {
    studentId: string;
    amountPaidPkr: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    paymentReference?: string;
    receivedBy: string;
    notes?: string;
    isConfirmed: boolean;
  }): Promise<{ success: boolean; receiptNumber?: string; payment?: Payment; error?: string }> => {
    try {
      const student = students.find((s) => s.id === data.studentId);
      if (!student) {
        return { success: false, error: 'Student record not found.' };
      }

      if (data.amountPaidPkr <= 0) {
        return { success: false, error: 'Payment amount must be greater than 0 PKR.' };
      }

      // Generate unique Receipt Number: REC-YYMM-XXXX
      const datePart = new Date().toISOString().slice(2, 7).replace('-', '');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const receiptNumber = `REC-${datePart}-${randomPart}`;

      const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        student_id: data.studentId,
        enrollment_id: `enr-${data.studentId}`,
        receipt_number: receiptNumber,
        amount_paid_pkr: Number(data.amountPaidPkr),
        payment_method: data.paymentMethod,
        payment_date: data.paymentDate,
        payment_reference: data.paymentReference,
        received_by: data.receivedBy,
        notes: data.notes,
        is_confirmed: data.isConfirmed,
        created_at: new Date().toISOString(),
      };

      // Update student financial balance
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id !== data.studentId) return s;
          const payable = s.final_payable_fee_pkr || s.original_fee_pkr || 0;
          const currentTotalPaid = (s.total_paid_pkr || 0) + (data.isConfirmed ? Number(data.amountPaidPkr) : 0);
          const remaining = Math.max(0, payable - currentTotalPaid);
          const status = currentTotalPaid >= payable ? 'Paid' : currentTotalPaid > 0 ? 'Partially Paid' : 'Unpaid';

          return {
            ...s,
            total_paid_pkr: currentTotalPaid,
            remaining_balance_pkr: remaining,
            payment_status: status,
          };
        })
      );

      setPayments((prev) => [newPayment, ...prev]);

      // Audit Log
      const log: AuditLog = {
        id: `log-${Date.now()}`,
        action: `Payment Recorded: Rs. ${data.amountPaidPkr.toLocaleString()} via ${data.paymentMethod}`,
        entity: 'Payment',
        entity_id: receiptNumber,
        details: {
          studentName: student.full_name,
          applicationId: student.application_id,
          amount: data.amountPaidPkr,
          method: data.paymentMethod,
        },
        performed_by: data.receivedBy,
        created_at: new Date().toISOString(),
      };
      setAuditLogs((prev) => [log, ...prev]);

      return { success: true, receiptNumber, payment: newPayment };
    } catch (err: any) {
      console.error('Record payment error:', err);
      return { success: false, error: err.message || 'Failed to record payment transaction.' };
    }
  };

  // Course Management Operations
  const addCourse = async (
    courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>
  ): Promise<boolean> => {
    try {
      const newCourse: Course = {
        ...courseData,
        id: `c-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isSupabaseLive && supabase) {
        const { data, error } = await supabase.from('courses').insert(courseData).select().single();
        if (error) throw error;
        if (data) newCourse.id = data.id;
      }

      setCourses((prev) => [newCourse, ...prev]);
      return true;
    } catch (err) {
      console.error('Failed to add course:', err);
      return false;
    }
  };

  const updateCourse = async (courseId: string, updates: Partial<Course>): Promise<boolean> => {
    try {
      if (isSupabaseLive && supabase) {
        const { error } = await supabase.from('courses').update(updates).eq('id', courseId);
        if (error) throw error;
      }

      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, ...updates, updated_at: new Date().toISOString() } : c))
      );
      return true;
    } catch (err) {
      console.error('Failed to update course:', err);
      return false;
    }
  };

  const toggleCourseStatus = async (courseId: string): Promise<boolean> => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return false;
    return updateCourse(courseId, { is_active: !course.is_active });
  };

  const deleteCourse = async (courseId: string): Promise<{ success: boolean; error?: string }> => {
    // Check if students are enrolled
    const enrolledCount = students.filter((s) => s.course_id === courseId).length;
    if (enrolledCount > 0) {
      return {
        success: false,
        error: `Cannot delete course: ${enrolledCount} student(s) currently enrolled. Deactivate it instead.`,
      };
    }

    if (isSupabaseLive && supabase) {
      await supabase.from('courses').delete().eq('id', courseId);
    }
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    return { success: true };
  };

  // Administrator Login
  const adminLogin = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. If Supabase is connected, authenticate via Supabase Auth
    if (isSupabaseLive && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          const profile: AdminProfile = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            full_name: data.user.user_metadata?.full_name || 'Administrator',
            role: 'admin',
          };
          setAdminUser(profile);
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // 2. Local Administration Auth (For initial setup and verified credentials)
    if (
      (cleanEmail === 'farzunmir@gmail.com' || cleanEmail === 'admin@nexora.edu.pk' || cleanEmail === 'admin') &&
      (password === 'Farhana@2026' || password === 'admin123' || password === 'admin')
    ) {
      const profile: AdminProfile = {
        id: 'admin-farhana',
        full_name: 'Farhana Aamir',
        email: 'farzunmir@gmail.com',
        role: 'superadmin',
      };
      setAdminUser(profile);
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid administrator credentials. Try farzunmir@gmail.com with password Farhana@2026 or connect Supabase.',
    };
  };

  const adminLogout = () => {
    if (isSupabaseLive && supabase) {
      supabase.auth.signOut();
    }
    setAdminUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        courses,
        students,
        payments,
        auditLogs,
        adminUser,
        isAdminLoggedIn: Boolean(adminUser),
        isSupabaseLive,
        isLoading,
        metrics,
        submitAdmissionForm,
        verifyStudentApplication,
        updateStudentStatus,
        reviewScholarship,
        assignCourseToStudent,
        deleteStudent,
        archiveStudent,
        recordPayment,
        addCourse,
        updateCourse,
        toggleCourseStatus,
        deleteCourse,
        adminLogin,
        adminLogout,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
