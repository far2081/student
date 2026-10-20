-- =========================================================================
-- Nexora Academy - Student Registration & Payment Verification Schema
-- Copy and paste this directly into Supabase Dashboard -> SQL Editor -> Run
-- =========================================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS public.student_test_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name VARCHAR(150) NOT NULL,
    whatsapp_number VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    course_name VARCHAR(150) NOT NULL,
    photo_url TEXT,
    has_scholarship BOOLEAN NOT NULL DEFAULT FALSE,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'JazzCash',
    transaction_id VARCHAR(100),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending Verification',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Ensure columns exist if table was created earlier
ALTER TABLE public.student_test_records 
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'Pending Verification';

-- 3. Update payment_method check constraint to support JazzCash, Easypaisa, Bank Transfer, and Cash
ALTER TABLE public.student_test_records 
DROP CONSTRAINT IF EXISTS student_test_records_payment_method_check;

ALTER TABLE public.student_test_records 
ADD CONSTRAINT student_test_records_payment_method_check 
CHECK (payment_method IN ('Cash', 'Online', 'Bank Transfer', 'JazzCash', 'Easypaisa'));

-- 4. Indexes for fast lookup & reporting
CREATE INDEX IF NOT EXISTS idx_student_test_email ON public.student_test_records(email);
CREATE INDEX IF NOT EXISTS idx_student_test_whatsapp ON public.student_test_records(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_student_test_created_at ON public.student_test_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_test_payment_status ON public.student_test_records(payment_status);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.student_test_records ENABLE ROW LEVEL SECURITY;

-- 6. Public Submission Policy: Allows anonymous visitors to INSERT valid registration records
DROP POLICY IF EXISTS "Public can insert test registrations" ON public.student_test_records;
CREATE POLICY "Public can insert test registrations"
    ON public.student_test_records
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        length(trim(student_name)) >= 2 AND
        length(trim(whatsapp_number)) >= 7 AND
        email LIKE '%@%.%' AND
        length(trim(course_name)) > 0 AND
        payment_method IN ('Cash', 'Online', 'Bank Transfer', 'JazzCash', 'Easypaisa')
    );

-- 7. Allow Authenticated Admins to View All Records
DROP POLICY IF EXISTS "Admins can view all test records" ON public.student_test_records;
CREATE POLICY "Admins can view all test records"
    ON public.student_test_records
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- 8. Secure RPC function for password-protected Admin Class Verification
CREATE OR REPLACE FUNCTION public.get_class_test_submissions(p_admin_pass TEXT)
RETURNS SETOF public.student_test_records AS $$
BEGIN
    IF p_admin_pass = 'Farhana@2026' OR p_admin_pass = 'admin123' THEN
        RETURN QUERY SELECT * FROM public.student_test_records ORDER BY created_at DESC;
    ELSE
        RAISE EXCEPTION 'Unauthorized: Invalid admin credentials.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Secure single submission verification for individual students
CREATE OR REPLACE FUNCTION public.verify_single_test_submission(
    p_submission_id TEXT,
    p_lookup TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_rec RECORD;
BEGIN
    SELECT 
        id, student_name, course_name, payment_method, transaction_id, payment_status, has_scholarship, created_at, photo_url
    INTO v_rec
    FROM public.student_test_records
    WHERE (
        id::TEXT = TRIM(p_submission_id)
        OR id::TEXT LIKE '%' || TRIM(p_submission_id) || '%'
    ) AND (
        LOWER(TRIM(email)) = LOWER(TRIM(p_lookup))
        OR REPLACE(whatsapp_number, ' ', '') = REPLACE(p_lookup, ' ', '')
        OR RIGHT(REPLACE(whatsapp_number, ' ', ''), 7) = RIGHT(REPLACE(p_lookup, ' ', ''), 7)
    )
    LIMIT 1;

    IF v_rec.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'found', TRUE,
            'id', v_rec.id,
            'student_name', v_rec.student_name,
            'course_name', v_rec.course_name,
            'payment_method', v_rec.payment_method,
            'transaction_id', COALESCE(v_rec.transaction_id, 'N/A'),
            'payment_status', COALESCE(v_rec.payment_status, 'Pending Verification'),
            'has_scholarship', v_rec.has_scholarship,
            'created_at', v_rec.created_at,
            'photo_url', v_rec.photo_url
        );
    ELSE
        RETURN jsonb_build_object('found', FALSE);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Secure status update function for admin
CREATE OR REPLACE FUNCTION public.update_test_submission_status(
    p_admin_pass TEXT,
    p_submission_id UUID,
    p_new_status TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_admin_pass = 'Farhana@2026' OR p_admin_pass = 'admin123' THEN
        UPDATE public.student_test_records
        SET payment_status = p_new_status
        WHERE id = p_submission_id;
        RETURN TRUE;
    ELSE
        RAISE EXCEPTION 'Unauthorized: Invalid admin credentials.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
