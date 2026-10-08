# Database Schema & Seed Data - TOEIC CBT Exam System

Thư mục này chứa file migration SQL và dữ liệu khởi tạo cho hệ thống thi thử TOEIC chuẩn format IIG.

## 1. Cấu trúc bảng dữ liệu (Tables)

| Tên bảng | Mô tả |
| :--- | :--- |
| `users` | Quản lý thông tin thí sinh và admin (vai trò `USER` / `ADMIN`). |
| `tests` | Danh mục đề thi (tiêu đề, mã đề, thời gian, audio nguyên bài). |
| `parts` | 7 Part của bài thi TOEIC (Part 1 - 7), lưu directions & audio hướng dẫn. |
| `passages` | Nhóm câu hỏi dùng chung đoạn đọc / audio / hình ảnh (Part 3, 4, 6, 7). |
| `questions` | Chi tiết từng câu hỏi (1 - 200), lưu transcript, dịch nghĩa, giải thích chi tiết, tag ngữ pháp/từ vựng. |
| `options` | Các lựa chọn đáp án A, B, C, D (Part 1-2 lưu `(A)`, `(B)`...; Part 2 chỉ có A, B, C). |
| `attempts` | Lịch sử các lần làm bài, lưu điểm thô và điểm quy đổi ETS (5 - 495). |
| `attempt_answers` | Chi tiết câu trả lời của từng lần thi (đáp án chọn, cờ đánh dấu flag, thời gian làm câu). |
| `score_conversion`| Bảng quy đổi điểm chuẩn ETS từ số câu đúng (0 - 100) sang điểm thi chuẩn (5 - 495). |

## 2. Hướng dẫn chạy Migration & Seed

### Cách 1: Sử dụng công cụ psql
```bash
# 1. Chạy migration tạo bảng
psql -U postgres -d toeic_cbt_db -f migrations/001_initial_schema.sql

# 2. Nạp bảng quy đổi điểm chuẩn ETS 0-100 -> 5-495
psql -U postgres -d toeic_cbt_db -f seeds/002_ets_score_conversion.sql
```

### Cách 2: Sử dụng Supabase / DBeaver / pgAdmin
1. Mở công cụ **SQL Editor**.
2. Mở nội dung file [001_initial_schema.sql](file:///c:/Users/handa/OneDrive/Documents/Projects/CloneIIG/database/migrations/001_initial_schema.sql) và nhấn **Execute (Run)**.
3. Mở tiếp file [002_ets_score_conversion.sql](file:///c:/Users/handa/OneDrive/Documents/Projects/CloneIIG/database/seeds/002_ets_score_conversion.sql) và nhấn **Execute (Run)**.
