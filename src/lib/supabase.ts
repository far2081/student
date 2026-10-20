import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Course, Student, Payment, AuditLog } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('your-project-id') &&
    supabaseUrl.startsWith('https://')
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Initial verified courses for Nexora Academy
export const INITIAL_COURSES: Course[] = [
  {
    id: 'c1-fsw-101',
    code: 'FSW-101',
    name: 'Full Stack Web & Cloud Development',
    description: 'MERN & Next.js, Node.js, REST APIs, Tailwind CSS, and Cloud Deployment.',
    duration: '3 Months',
    fee_pkr: 45000,
    is_active: true,
    installments_allowed: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c2-ai-201',
    code: 'AI-201',
    name: 'Artificial Intelligence & Generative Agents',
    description: 'Python, LangChain, OpenAI/Gemini APIs, Prompt Engineering, Autonomous Multi-Agent Systems.',
    duration: '3 Months',
    fee_pkr: 55000,
    is_active: true,
    installments_allowed: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c3-mad-301',
    code: 'MAD-301',
    name: 'Mobile App Development (Flutter & React Native)',
    description: 'Cross-platform native iOS & Android development, Firebase integration, offline-first apps.',
    duration: '3 Months',
    fee_pkr: 40000,
    is_active: true,
    installments_allowed: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c4-uxd-401',
    code: 'UXD-401',
    name: 'UI/UX Design & Digital Product Design',
    description: 'Figma masterclass, wireframing, high-fidelity design systems, user testing, and UX research.',
    duration: '2 Months',
    fee_pkr: 35000,
    is_active: true,
    installments_allowed: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c5-csh-501',
    code: 'CSH-501',
    name: 'Cyber Security & Ethical Hacking',
    description: 'Network penetration testing, vulnerability assessment, cryptography, Linux systems, Web security.',
    duration: '4 Months',
    fee_pkr: 50000,
    is_active: true,
    installments_allowed: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c6-do-601',
    code: 'DO-601',
    name: 'Cloud Computing & DevOps Engineering',
    description: 'Docker, Kubernetes, AWS, CI/CD pipelines, Terraform Infrastructure as Code.',
    duration: '3 Months',
    fee_pkr: 48000,
    is_active: true,
    installments_allowed: 3,
    created_at: new Date().toISOString(),
  },
];

// Initial demonstration student to test reports, payment history, and dashboard metrics
export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-101',
    application_id: 'NX-2610-1001',
    full_name: 'Muhammad Bilal Khan',
    whatsapp: '+92 300 1234567',
    email: 'bilal.khan@example.com',
    city: 'Lahore',
    qualification: 'BS Computer Science',
    notes: 'Keen on specialized AI agent workflows.',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    privacy_consent: true,
    admission_status: 'approved',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    course_id: 'c2-ai-201',
    course_code: 'AI-201',
    course_name: 'Artificial Intelligence & Generative Agents',
    course_duration: '3 Months',
    original_fee_pkr: 55000,
    approved_discount_pkr: 10000,
    final_payable_fee_pkr: 45000,
    scholarship_status: 'approved',
    scholarship_category: 'Merit-Based',
    scholarship_reason: 'Graduated in top 5% of class; seeking specialization.',
    total_paid_pkr: 25000,
    remaining_balance_pkr: 20000,
    payment_status: 'Partially Paid',
  },
  {
    id: 'std-102',
    application_id: 'NX-2610-1002',
    full_name: 'Ayesha Siddiqua',
    whatsapp: '+92 321 9876543',
    email: 'ayesha.s@example.com',
    city: 'Karachi',
    qualification: 'Intermediate (Pre-Eng)',
    notes: 'Applying for Female Empowerment scholarship.',
    photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
    privacy_consent: true,
    admission_status: 'pending',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    course_id: 'c1-fsw-101',
    course_code: 'FSW-101',
    course_name: 'Full Stack Web & Cloud Development',
    course_duration: '3 Months',
    original_fee_pkr: 45000,
    approved_discount_pkr: 0,
    final_payable_fee_pkr: 45000,
    scholarship_status: 'pending',
    scholarship_category: 'Female Empowerment',
    scholarship_reason: 'Aspiring woman in tech looking to build modern cloud apps.',
    total_paid_pkr: 0,
    remaining_balance_pkr: 45000,
    payment_status: 'Unpaid',
  },
  {
    id: 'std-103',
    application_id: 'NX-2610-1003',
    full_name: 'Usman Tariq',
    whatsapp: '+92 333 4567890',
    email: 'usman.tariq@example.com',
    city: 'Islamabad',
    qualification: 'Bachelors in Software Engineering',
    notes: 'Paid full fee in cash upon registration.',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    privacy_consent: true,
    admission_status: 'approved',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    course_id: 'c5-csh-501',
    course_code: 'CSH-501',
    course_name: 'Cyber Security & Ethical Hacking',
    course_duration: '4 Months',
    original_fee_pkr: 50000,
    approved_discount_pkr: 0,
    final_payable_fee_pkr: 50000,
    scholarship_status: 'not_applied',
    total_paid_pkr: 50000,
    remaining_balance_pkr: 0,
    payment_status: 'Paid',
  },
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-001',
    student_id: 'std-101',
    enrollment_id: 'enr-101',
    receipt_number: 'REC-2610-001',
    amount_paid_pkr: 25000,
    payment_method: 'Cash',
    payment_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    received_by: 'Admin / Farhana Aamir',
    notes: '1st Installment confirmed in cash.',
    is_confirmed: true,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'pay-002',
    student_id: 'std-103',
    enrollment_id: 'enr-103',
    receipt_number: 'REC-2610-002',
    amount_paid_pkr: 50000,
    payment_method: 'Bank Transfer',
    payment_date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    payment_reference: 'MBL-992384102',
    received_by: 'Accountant',
    notes: 'Full lump sum payment verified via bank portal.',
    is_confirmed: true,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    action: 'System Initialized',
    entity: 'System',
    entity_id: 'ALL',
    details: { message: 'Nexora Academy portal initialized.' },
    performed_by: 'Superadmin',
    created_at: new Date().toISOString(),
  },
];
