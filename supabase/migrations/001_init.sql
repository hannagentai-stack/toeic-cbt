-- ==============================================================================
-- SUPABASE MIGRATION: 001_init.sql
-- Hệ thống thi thử TOEIC CBT - Auth, Database & Private Storage
-- ==============================================================================

-- 1. KÍCH HOẠT EXTENSIONS CẦN THIẾT
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ĐỊNH NGHĨA CÁC BẢNG DỮ LIỆU CHÍNH (TABLES)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 2.1 BẢNG PROFILES (Hồ sơ người dùng / Thí sinh / Admin)
-- Liên kết 1-1 với auth.users thông qua ID
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  date_of_birth TEXT,
  candidate_id TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2.2 BẢNG TESTS (Ngân hàng đề thi TOEIC)
-- Hỗ trợ đề do user tự nhập hoặc đề hệ thống (owner_id = NULL)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_complete BOOLEAN NOT NULL DEFAULT true,
  source_format TEXT NOT NULL DEFAULT 'json',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index tăng tốc tìm kiếm và lọc đề thi
CREATE INDEX IF NOT EXISTS idx_tests_owner_id ON public.tests(owner_id);
CREATE INDEX IF NOT EXISTS idx_tests_is_public ON public.tests(is_public);

-- ------------------------------------------------------------------------------
-- 2.3 BẢNG ATTEMPTS (Lịch sử làm bài thi & tiến độ làm dở)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attempts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id TEXT REFERENCES public.tests(id) ON DELETE SET NULL,
  mode TEXT NOT NULL DEFAULT 'full',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score_listening INTEGER,
  score_reading INTEGER,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  submitted_at TIMESTAMPTZ
);

-- Index tăng tốc truy vấn lịch sử thi theo người dùng và đề
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON public.attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_test_id ON public.attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON public.attempts(status);

-- ==============================================================================
-- 3. HÀM HỖ TRỢ VÀ TRIGGER (FUNCTIONS & TRIGGERS)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 3.1 Hàm kiểm tra quyền Admin: is_admin()
-- Chạy với đặc quyền SECURITY DEFINER để đọc bảng profiles mà không bị lặp vô hạn RLS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- ------------------------------------------------------------------------------
-- 3.2 Trigger tự động tạo record profile khi có user mới đăng ký qua Supabase Auth
-- Tự động trích xuất metadata (full_name, candidate_id) nếu có từ form đăng ký
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, date_of_birth, candidate_id, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'date_of_birth', ''),
    COALESCE(
      NEW.raw_user_meta_data->>'candidate_id',
      'SBD-' || UPPER(SUBSTRING(NEW.id::text, 1, 8))
    ),
    'user' -- Luôn mặc định là user thông thường khi đăng ký
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 3.3 Trigger bảo vệ cột role của profiles: Người dùng không được tự nâng quyền
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Bạn không có quyền thay đổi vai trò (role) của tài khoản.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) - BẬT CHO TẤT CẢ CÁC BẢNG
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 4.1 Chính sách RLS cho bảng PROFILES
-- ------------------------------------------------------------------------------
-- SELECT: Người dùng chỉ được xem profile của chính mình; Admin xem được tất cả
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR public.is_admin()
  );

-- INSERT: Dự phòng cho client muốn tự tạo profile của mình (với role = 'user')
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id AND (role = 'user' OR public.is_admin())
  );

-- UPDATE: Người dùng chỉ được sửa thông tin profile của chính mình (cột role bị khóa qua trigger & CHECK)
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = id OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 4.2 Chính sách RLS cho bảng TESTS
-- ------------------------------------------------------------------------------
-- SELECT: Đọc được nếu đề thi được công khai (is_public = true) HOẶC là chủ sở hữu (owner_id = auth.uid()) HOẶC là admin
DROP POLICY IF EXISTS "tests_select_policy" ON public.tests;
CREATE POLICY "tests_select_policy"
  ON public.tests
  FOR SELECT
  TO authenticated
  USING (
    is_public = true
    OR owner_id = auth.uid()
    OR public.is_admin()
  );

-- INSERT: Người dùng chỉ được tạo đề thi với owner_id là chính mình; Chỉ admin mới được đặt is_public = true khi tạo
DROP POLICY IF EXISTS "tests_insert_policy" ON public.tests;
CREATE POLICY "tests_insert_policy"
  ON public.tests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (owner_id = auth.uid() OR public.is_admin())
    AND (
      is_public = false
      OR public.is_admin()
    )
  );

-- UPDATE: Chỉ sửa được đề thi do chính mình sở hữu hoặc admin; Chỉ admin mới được đặt hoặc giữ is_public = true
DROP POLICY IF EXISTS "tests_update_policy" ON public.tests;
CREATE POLICY "tests_update_policy"
  ON public.tests
  FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() OR public.is_admin()
  )
  WITH CHECK (
    (owner_id = auth.uid() OR public.is_admin())
    AND (
      is_public = false
      OR public.is_admin()
    )
  );

-- DELETE: Chỉ xóa được đề thi do chính mình tạo hoặc do admin xóa
DROP POLICY IF EXISTS "tests_delete_policy" ON public.tests;
CREATE POLICY "tests_delete_policy"
  ON public.tests
  FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 4.3 Chính sách RLS cho bảng ATTEMPTS
-- ------------------------------------------------------------------------------
-- SELECT: Thí sinh chỉ xem được lịch sử bài thi của chính mình; Admin xem được toàn bộ
DROP POLICY IF EXISTS "attempts_select_policy" ON public.attempts;
CREATE POLICY "attempts_select_policy"
  ON public.attempts
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR public.is_admin()
  );

-- INSERT: Thí sinh chỉ được ghi nhận bài thi với user_id là chính mình
DROP POLICY IF EXISTS "attempts_insert_policy" ON public.attempts;
CREATE POLICY "attempts_insert_policy"
  ON public.attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- UPDATE: Thí sinh chỉ được cập nhật tiến độ (câu trả lời, thời gian, điểm) của chính mình
DROP POLICY IF EXISTS "attempts_update_policy" ON public.attempts;
CREATE POLICY "attempts_update_policy"
  ON public.attempts
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- DELETE: Thí sinh chỉ được xóa lịch sử làm bài của chính mình hoặc admin dọn dẹp
DROP POLICY IF EXISTS "attempts_delete_policy" ON public.attempts;
CREATE POLICY "attempts_delete_policy"
  ON public.attempts
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR public.is_admin()
  );

-- ==============================================================================
-- 5. STORAGE BUCKET VÀ CHÍNH SÁCH TRUY CẬP (STORAGE RLS)
-- Bucket 'test-media' riêng tư, đường dẫn lưu trữ: {owner_id}/{test_id}/...
-- ==============================================================================

-- Khởi tạo bucket 'test-media' chế độ riêng tư (public = false)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'test-media',
  'test-media',
  false,
  52428800, -- Giới hạn tối đa 50MB mỗi file audio / hình ảnh
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = false;

-- ------------------------------------------------------------------------------
-- 5.1 Storage INSERT: User chỉ được upload file vào thư mục gốc mang UID của mình ({owner_id}/...)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "storage_test_media_insert_policy" ON storage.objects;
CREATE POLICY "storage_test_media_insert_policy"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'test-media'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

-- ------------------------------------------------------------------------------
-- 5.2 Storage UPDATE: User chỉ được cập nhật/ghi đè file trong thư mục của chính mình
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "storage_test_media_update_policy" ON storage.objects;
CREATE POLICY "storage_test_media_update_policy"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'test-media'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  )
  WITH CHECK (
    bucket_id = 'test-media'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

-- ------------------------------------------------------------------------------
-- 5.3 Storage DELETE: User chỉ được xóa file trong thư mục của chính mình
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "storage_test_media_delete_policy" ON storage.objects;
CREATE POLICY "storage_test_media_delete_policy"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'test-media'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

-- ------------------------------------------------------------------------------
-- 5.4 Storage SELECT: 
-- - User đọc được file trong thư mục cá nhân của mình
-- - Hoặc admin đọc được tất cả
-- - Hoặc nếu file thuộc về đề thi công khai (tests.is_public = true với tests.id = {test_id})
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "storage_test_media_select_policy" ON storage.objects;
CREATE POLICY "storage_test_media_select_policy"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'test-media'
    AND (
      -- 1. File trong thư mục riêng của thí sinh hoặc admin truy cập
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
      -- 2. File của đề thi đã được công khai: mọi user đã đăng nhập đều nghe/xem được
      OR EXISTS (
        SELECT 1
        FROM public.tests t
        WHERE t.id = (storage.foldername(name))[2]
          AND t.is_public = true
      )
    )
  );
