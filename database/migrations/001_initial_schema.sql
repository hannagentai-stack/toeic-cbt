-- ==============================================================================
-- DATABASE MIGRATION: TOEIC CBT EXAM SYSTEM (IIG VIETNAM FORMAT)
-- File: 001_initial_schema.sql
-- Description: Tạo toàn bộ bảng dữ liệu, ràng buộc (constraints), index và trigger
-- ==============================================================================

-- Kích hoạt extension sinh UUID tự động
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. BẢNG USERS (Người dùng / Thí sinh / Admin)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 2. BẢNG TESTS (Danh mục đề thi TOEIC)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 120,
    total_questions INT NOT NULL DEFAULT 200,
    full_audio_url TEXT, -- File âm thanh nguyên bài cho chế độ thi thử toàn bài
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 3. BẢNG PARTS (7 Part của bài thi TOEIC)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    part_number INT NOT NULL CHECK (part_number BETWEEN 1 AND 7),
    name VARCHAR(100) NOT NULL,
    directions_text TEXT,
    directions_audio_url TEXT,
    total_questions INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_test_part UNIQUE (test_id, part_number)
);

-- ------------------------------------------------------------------------------
-- 4. BẢNG PASSAGES (Nhóm câu hỏi dùng chung audio / đoạn văn bản / hình ảnh)
--    Dùng cho Part 3, 4 (audio hội thoại/bài nói), Part 6, 7 (đoạn đọc đơn/kép/ba)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS passages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    part_number INT NOT NULL CHECK (part_number BETWEEN 1 AND 7),
    title VARCHAR(255), -- Ví dụ: "Questions 71-73 refer to the following announcement"
    content TEXT,       -- Văn bản đọc (Part 6, 7), hỗ trợ HTML/Markdown định dạng
    audio_url TEXT,     -- Audio riêng của nhóm câu (Part 3, 4)
    image_url TEXT,     -- Hình ảnh biểu đồ, hóa đơn, bảng biểu kèm theo
    order_index INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 5. BẢNG QUESTIONS (Chi tiết từng câu hỏi từ 1 đến 200)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    passage_id UUID REFERENCES passages(id) ON DELETE SET NULL,
    part_number INT NOT NULL CHECK (part_number BETWEEN 1 AND 7),
    question_number INT NOT NULL, -- Số thứ tự câu (1 - 200)
    question_type VARCHAR(50) NOT NULL, -- PHOTO, QUESTION_RESPONSE, CONVERSATION, SHORT_TALK, INCOMPLETE_SENTENCE, TEXT_COMPLETION, READING_COMPREHENSION
    question_text TEXT,           -- Part 1 & 2 để NULL vì trong đề thi thật không in text câu hỏi
    audio_url TEXT,               -- Audio riêng cho câu hỏi (tiện cho chế độ ôn luyện)
    image_url TEXT,               -- Hình ảnh tranh chụp Part 1 hoặc ảnh minh họa câu
    audio_timestamp NUMERIC(8, 2),-- Mốc thời gian (giây) trong Full Audio (để auto-scroll khi thi thật)
    transcript TEXT,              -- Lời thoại Audio / Ngữ cảnh đầy đủ
    vietnamese_translation TEXT,  -- Bản dịch tiếng Việt hỗ trợ học viên
    explanation TEXT,             -- Lời giải thích chi tiết đáp án & mẹo làm bài
    tags JSONB NOT NULL DEFAULT '[]'::jsonb, -- Tag ngữ pháp, chủ đề từ vựng (ví dụ: ["tense", "business"])
    correct_option VARCHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_test_question_number UNIQUE (test_id, question_number)
);

-- ------------------------------------------------------------------------------
-- 6. BẢNG OPTIONS (Lựa chọn trả lời A, B, C, D)
--    Part 1, 2: Không hiển thị chữ, option_text là "(A)", "(B)", "(C)" (Part 2 không có D)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_label VARCHAR(1) NOT NULL CHECK (option_label IN ('A', 'B', 'C', 'D')),
    option_text TEXT NOT NULL, -- Nội dung lựa chọn. Part 1 & 2 lưu "(A)", "(B)", v.v.
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_question_option UNIQUE (question_id, option_label)
);

-- ------------------------------------------------------------------------------
-- 7. BẢNG ATTEMPTS (Lượt thi / làm bài của người dùng)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    mode VARCHAR(20) NOT NULL DEFAULT 'FULL_TEST' CHECK (mode IN ('FULL_TEST', 'PRACTICE')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    duration_seconds INT NOT NULL DEFAULT 0,
    listening_raw_score INT NOT NULL DEFAULT 0, -- Số câu nghe đúng (0 - 100)
    reading_raw_score INT NOT NULL DEFAULT 0,   -- Số câu đọc đúng (0 - 100)
    listening_scaled_score INT NOT NULL DEFAULT 5, -- Thang điểm ETS (5 - 495)
    reading_scaled_score INT NOT NULL DEFAULT 5,   -- Thang điểm ETS (5 - 495)
    total_score INT NOT NULL DEFAULT 10,           -- Thang điểm ETS (10 - 990)
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 8. BẢNG ATTEMPT_ANSWERS (Chi tiết từng câu trả lời trong lượt thi)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    question_number INT NOT NULL,
    selected_option VARCHAR(1) CHECK (selected_option IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    is_flagged BOOLEAN NOT NULL DEFAULT FALSE, -- Cờ đánh dấu xem lại
    time_spent_seconds INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
);

-- ------------------------------------------------------------------------------
-- 9. BẢNG SCORE_CONVERSION (Bảng tra điểm quy đổi chuẩn ETS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS score_conversion (
    id SERIAL PRIMARY KEY,
    raw_score INT NOT NULL UNIQUE CHECK (raw_score BETWEEN 0 AND 100),
    listening_score INT NOT NULL CHECK (listening_score BETWEEN 5 AND 495),
    reading_score INT NOT NULL CHECK (reading_score BETWEEN 5 AND 495)
);

-- ------------------------------------------------------------------------------
-- 10. TẠO INDEXES TỐI ƯU TRUY VẤN
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_questions_test_part ON questions(test_id, part_number);
CREATE INDEX IF NOT EXISTS idx_questions_passage ON questions(passage_id);
CREATE INDEX IF NOT EXISTS idx_options_question ON options(question_id);
CREATE INDEX IF NOT EXISTS idx_passages_test_part ON passages(test_id, part_number);
CREATE INDEX IF NOT EXISTS idx_attempts_user_test ON attempts(user_id, test_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON questions USING GIN (tags);

-- ------------------------------------------------------------------------------
-- 11. TRIGGER CẬP NHẬT updated_at TỰ ĐỘNG
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_users_timestamp ON users;
CREATE TRIGGER trg_update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_tests_timestamp ON tests;
CREATE TRIGGER trg_update_tests_timestamp
BEFORE UPDATE ON tests
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_questions_timestamp ON questions;
CREATE TRIGGER trg_update_questions_timestamp
BEFORE UPDATE ON questions
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
