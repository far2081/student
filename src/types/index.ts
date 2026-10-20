export type AdmissionStatus = 'pending' | 'approved' | 'rejected' | 'archived';
export type ScholarshipStatus = 'not_applied' | 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Online Payment' | 'Other';
export type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Paid';
export type AdminRole = 'superadmin' | 'admin' | 'accountant';

export interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  role: AdminRole;
  created_at?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  duration: string;
  fee_pkr: number;
  is_active: boolean;
  installments_allowed: number;
  created_at?: string;
  updated_at?: string;
}

export interface Student {
  id: string;
  application_id: string;
  full_name: string;
  whatsapp: string;
  email: string;
  city?: string;
  qualification?: string;
  notes?: string;
  photo_url: string;
  privacy_consent: boolean;
  admission_status: AdmissionStatus;
  created_at: string;
  updated_at?: string;
  // Joined or composite properties
  course_id?: string;
  course_name?: string;
  course_code?: string;
  course_duration?: string;
  original_fee_pkr?: number;
  approved_discount_pkr?: number;
  final_payable_fee_pkr?: number;
  scholarship_status?: ScholarshipStatus;
  scholarship_category?: string;
  scholarship_reason?: string;
  scholarship_doc_url?: string;
  total_paid_pkr?: number;
  remaining_balance_pkr?: number;
  payment_status?: PaymentStatus;
}

export interface ScholarshipApplication {
  id: string;
  student_id: string;
  is_applying: boolean;
  category?: string;
  reason?: string;
  document_url?: string;
  status: ScholarshipStatus;
  discount_amount_pkr: number;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  original_course_fee_pkr: number;
  approved_discount_pkr: number;
  final_payable_fee_pkr: number;
  enrollment_date: string;
  created_at?: string;
}

export interface Payment {
  id: string;
  student_id: string;
  enrollment_id: string;
  receipt_number: string;
  amount_paid_pkr: number;
  payment_method: PaymentMethod;
  payment_date: string;
  payment_reference?: string;
  received_by: string;
  admin_id?: string;
  notes?: string;
  is_confirmed: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  performed_by: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalApplications: number;
  newApplications: number;
  approvedAdmissions: number;
  activeCourses: number;
  scholarshipApplications: number;
  approvedScholarships: number;
  totalConfirmedCollection: number;
  totalCashCollection: number;
  totalOutstandingBalance: number;
}
