-- =========================================================================
-- Nexora Academy - Student Admission & Fee Management Portal
-- Complete PostgreSQL Database Schema & Security Policies for Supabase
-- =========================================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. ADMIN PROFILES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'accountant')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 2. COURSES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    duration TEXT NOT NULL,
    fee_pkr NUMERIC(12, 2) NOT NULL CHECK (fee_pkr >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    installments_allowed INTEGER NOT NULL DEFAULT 2 CHECK (installments_allowed >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 3. STUDENTS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT,
    qualification TEXT,
    notes TEXT,
    photo_url TEXT NOT NULL,
    privacy_consent BOOLEAN NOT NULL DEFAULT TRUE,
    admission_status TEXT NOT NULL DEFAULT 'pending' CHECK (admission_status IN ('pending', 'approved', 'rejected', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_students_app_id ON public.students(application_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_whatsapp ON public.students(whatsapp);
CREATE INDEX IF NOT EXISTS idx_students_admission_status ON public.students(admission_status);

-- -------------------------------------------------------------------------
-- 4. SCHOLARSHIP APPLICATIONS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scholarship_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    is_applying BOOLEAN NOT NULL DEFAULT FALSE,
    category TEXT CHECK (category IN ('Need-Based', 'Merit-Based', 'Orphan / Disability', 'Hafiz-e-Quran', 'Female Empowerment', 'Other', NULL)),
    reason TEXT,
    document_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('not_applied', 'pending', 'approved', 'rejected')),
    discount_amount_pkr NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount_pkr >= 0),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.admin_profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_scholarship UNIQUE (student_id)
);

-- -------------------------------------------------------------------------
-- 5. ENROLLMENTS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
    original_course_fee_pkr NUMERIC(12, 2) NOT NULL CHECK (original_course_fee_pkr >= 0),
    approved_discount_pkr NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (approved_discount_pkr >= 0),
    final_payable_fee_pkr NUMERIC(12, 2) GENERATED ALWAYS AS (original_course_fee_pkr - approved_discount_pkr) STORED,
    enrollment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_course UNIQUE (student_id, course_id)
);

-- -------------------------------------------------------------------------
-- 6. PAYMENTS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
    receipt_number TEXT NOT NULL UNIQUE,
    amount_paid_pkr NUMERIC(12, 2) NOT NULL CHECK (amount_paid_pkr > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Online Payment', 'Other')),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_reference TEXT,
    received_by TEXT NOT NULL,
    admin_id UUID REFERENCES public.admin_profiles(id),
    notes TEXT,
    is_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_receipt_number ON public.payments(receipt_number);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);

-- -------------------------------------------------------------------------
-- 7. AUDIT LOGS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    performed_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- HELPER FUNCTIONS & TRIGGERS
-- -------------------------------------------------------------------------

-- Check if current authenticated user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate unique application ID
CREATE OR REPLACE FUNCTION public.generate_application_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    done BOOLEAN;
BEGIN
    done := FALSE;
    WHILE NOT done LOOP
        new_id := 'NX-' || TO_CHAR(CURRENT_DATE, 'YYMM') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        done := NOT EXISTS (SELECT 1 FROM public.students WHERE application_id = new_id);
    END LOOP;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Generate unique receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
    new_rec TEXT;
    done BOOLEAN;
BEGIN
    done := FALSE;
    WHILE NOT done LOOP
        new_rec := 'REC-' || TO_CHAR(CURRENT_DATE, 'YYMM') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        done := NOT EXISTS (SELECT 1 FROM public.payments WHERE receipt_number = new_rec);
    END LOOP;
    RETURN new_rec;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. admin_profiles policies
CREATE POLICY "Admins can view admin profiles"
    ON public.admin_profiles FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Superadmins can manage admin profiles"
    ON public.admin_profiles FOR ALL
    USING (public.is_admin());

-- 2. courses policies
CREATE POLICY "Public can view active courses"
    ON public.courses FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage courses"
    ON public.courses FOR ALL
    USING (public.is_admin());

-- 3. students policies
CREATE POLICY "Public can submit admission application"
    ON public.students FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "Admins can view and manage all students"
    ON public.students FOR ALL
    USING (public.is_admin());

-- 4. scholarship_applications policies
CREATE POLICY "Public can submit scholarship application"
    ON public.scholarship_applications FOR INSERT
    WITH CHECK (status = 'pending' OR status = 'not_applied');

CREATE POLICY "Admins can view and manage scholarship applications"
    ON public.scholarship_applications FOR ALL
    USING (public.is_admin());

-- 5. enrollments policies
CREATE POLICY "Admins can view and manage enrollments"
    ON public.enrollments FOR ALL
    USING (public.is_admin());

-- 6. payments policies
CREATE POLICY "Admins can view and manage payments"
    ON public.payments FOR ALL
    USING (public.is_admin());

-- 7. audit_logs policies
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (public.is_admin());

-- -------------------------------------------------------------------------
-- SECURE PUBLIC APPLICATION STATUS VERIFICATION RPC
-- Returns only non-sensitive application details for verified applicant
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_student_application(
    p_application_id TEXT,
    p_phone_or_email TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'application_id', s.application_id,
        'full_name', s.full_name,
        'city', s.city,
        'admission_status', s.admission_status,
        'created_at', s.created_at,
        'course_name', c.name,
        'course_duration', c.duration,
        'original_fee_pkr', e.original_course_fee_pkr,
        'approved_discount_pkr', COALESCE(e.approved_discount_pkr, 0),
        'final_payable_fee_pkr', COALESCE(e.final_payable_fee_pkr, e.original_course_fee_pkr),
        'scholarship_status', COALESCE(sa.status, 'not_applied'),
        'total_paid_pkr', COALESCE((
            SELECT SUM(p.amount_paid_pkr)
            FROM public.payments p
            WHERE p.enrollment_id = e.id AND p.is_confirmed = TRUE
        ), 0),
        'remaining_balance_pkr', (
            COALESCE(e.final_payable_fee_pkr, e.original_course_fee_pkr) - 
            COALESCE((
                SELECT SUM(p.amount_paid_pkr)
                FROM public.payments p
                WHERE p.enrollment_id = e.id AND p.is_confirmed = TRUE
            ), 0)
        )
    ) INTO v_result
    FROM public.students s
    JOIN public.enrollments e ON e.student_id = s.id
    JOIN public.courses c ON c.id = e.course_id
    LEFT JOIN public.scholarship_applications sa ON sa.student_id = s.id
    WHERE LOWER(TRIM(s.application_id)) = LOWER(TRIM(p_application_id))
      AND (
          LOWER(TRIM(s.email)) = LOWER(TRIM(p_phone_or_email))
          OR REPLACE(s.whatsapp, ' ', '') = REPLACE(p_phone_or_email, ' ', '')
          OR RIGHT(REPLACE(s.whatsapp, ' ', ''), 10) = RIGHT(REPLACE(p_phone_or_email, ' ', ''), 10)
      );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------------------
-- SEED INITIAL COURSES DATA
-- -------------------------------------------------------------------------
INSERT INTO public.courses (code, name, description, duration, fee_pkr, is_active, installments_allowed)
VALUES
    ('FSW-101', 'Full Stack Web & Cloud Development', 'MERN & Next.js, Node.js, REST APIs, Tailwind CSS, and Cloud Deployment.', '3 Months', 45000.00, TRUE, 3),
    ('AI-201', 'Artificial Intelligence & Generative Agents', 'Python, LangChain, OpenAI/Gemini APIs, Prompt Engineering, Autonomous Multi-Agent Systems.', '3 Months', 55000.00, TRUE, 3),
    ('MAD-301', 'Mobile App Development (Flutter & React Native)', 'Cross-platform native iOS & Android development, Firebase integration, offline-first apps.', '3 Months', 40000.00, TRUE, 2),
    ('UXD-401', 'UI/UX Design & Digital Product Design', 'Figma masterclass, wireframing, high-fidelity design systems, user testing, and UX research.', '2 Months', 35000.00, TRUE, 2),
    ('CSH-501', 'Cyber Security & Ethical Hacking', 'Network penetration testing, vulnerability assessment, cryptography, Linux systems, Web security.', '4 Months', 50000.00, TRUE, 4),
    ('DO-601', 'Cloud Computing & DevOps Engineering', 'Docker, Kubernetes, AWS, CI/CD pipelines, Terraform Infrastructure as Code.', '3 Months', 48000.00, TRUE, 3)
ON CONFLICT (code) DO UPDATE 
SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    duration = EXCLUDED.duration,
    fee_pkr = EXCLUDED.fee_pkr,
    is_active = EXCLUDED.is_active;

-- -------------------------------------------------------------------------
-- STORAGE BUCKETS (Execute in Supabase Storage or Dashboard)
-- -------------------------------------------------------------------------
-- insert into storage.buckets (id, name, public) values ('student-photos', 'student-photos', true);
-- insert into storage.buckets (id, name, public) values ('scholarship-documents', 'scholarship-documents', false);
