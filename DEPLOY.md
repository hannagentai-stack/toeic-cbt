# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG TOEIC CBT MOCK TEST LÊN VERCEL

Tài liệu này hướng dẫn chi tiết từng bước (step-by-step) cách đưa website thi thử TOEIC CBT từ máy tính của bạn lên Internet miễn phí thông qua **GitHub**, **Vercel** và **Supabase**. Hướng dẫn được viết đơn giản, dễ hiểu dành cho cả người mới bắt đầu.

---

## MỤC LỤC
1. [Bước 1: Đẩy mã nguồn lên GitHub an toàn](#bước-1-đẩy-mã-nguồn-lên-github-an-toàn)
2. [Bước 2: Import dự án vào Vercel](#bước-2-import-dự-án-vào-vercel)
3. [Bước 3: Cấu hình biến môi trường trên Vercel](#bước-3-cấu-hình-biến-môi-trường-trên-vercel)
4. [Bước 4: Cập nhật cấu hình Supabase & Google OAuth](#bước-4-cập-nhật-cấu-hình-supabase--google-oauth)
5. [Bước 5: Kiểm tra hệ thống sau triển khai (Smoke Test)](#bước-5-kiểm-tra-hệ-thống-sau-triển-khai-smoke-test)
6. [Bước 6: Khắc phục các lỗi thường gặp](#bước-6-khắc-phục-các-lỗi-thường-gặp)
7. [Bước 7: Cách quay lại phiên bản trước (Rollback) trên Vercel](#bước-7-cách-quay-lại-phiên-bản-trước-rollback-trên-vercel)

---

## BƯỚC 1: ĐẨY MÃ NGUỒN LÊN GITHUB AN TOÀN

### 1.1 Kiểm tra để chắc chắn KHÔNG đẩy nhầm file môi trường (`.env`)
File chứa thông tin bí mật (mật khẩu, key bí mật) tuyệt đối không được đưa lên GitHub. Hãy kiểm tra bằng các lệnh sau:

1. Mở cửa sổ dòng lệnh (Terminal hoặc PowerShell) tại thư mục dự án `CloneIIG`.
2. Kiểm tra trạng thái Git:
   ```bash
   git status
   ```
3. **Quy tắc an toàn**: Trong danh sách file chuẩn bị đưa lên (Untracked files / Changes to be committed):
   - **ĐƯỢC PHÉP THẤY**: `.env.example`, `client/.env.example`, mã nguồn `.ts`, `.tsx`, `.json`, `.css`.
   - **TUYỆT ĐỐI KHÔNG ĐƯỢC THẤY**: `.env`, `.env.local`, `.env.production`.
   
   *(Nếu bạn thấy các file `.env` xuất hiện, hãy kiểm tra lại file `.gitignore` ở thư mục gốc và thư mục `client` xem đã có dòng `.env` chưa).*

### 1.2 Khởi tạo Git và đẩy code lên GitHub
Nếu đây là lần đầu bạn đưa dự án lên GitHub, hãy thực hiện theo các bước sau:

1. Đăng nhập vào [GitHub](https://github.com), bấm nút **New Repository** (Tạo kho lưu trữ mới).
2. Đặt tên kho lưu trữ (ví dụ: `toeic-cbt-mocktest`), chọn chế độ **Private** (khuyên dùng để bảo mật) hoặc **Public**, sau đó bấm **Create repository**.
3. Quay lại Terminal trên máy tính và chạy lần lượt các lệnh:
   ```bash
   git init
   git add .
   git commit -m "feat: chuẩn bị triển khai phiên bản TOEIC CBT lên Vercel"
   git branch -M main
   git remote add origin https://github.com/TÊN_GITHUB_CỦA_BẠN/TÊN_REPO_CỦA_BẠN.git
   git push -u origin main
   ```

---

## BƯỚC 2: IMPORT DỰ ÁN VÀO VERCEL

1. Truy cập trang quản trị [Vercel](https://vercel.com) và đăng nhập bằng tài khoản GitHub của bạn.
2. Tại màn hình Dashboard, bấm nút **Add New...** → chọn **Project**.
3. Tìm kho lưu trữ GitHub bạn vừa tải lên (ví dụ: `toeic-cbt-mocktest`) và bấm **Import**.
4. **CẤU HÌNH BẮT BUỘC (QUAN TRỌNG NHẤT)**:
   * **Project Name**: Đặt tên dự án (ví dụ: `toeic-cbt-exam`).
   * **Framework Preset**: Chọn **Vite**.
   * **Root Directory**: Bấm nút **Edit**, chọn thư mục `client` và bấm **Continue**. *(Nếu bỏ qua bước này, Vercel sẽ báo lỗi không tìm thấy file build).*
   * **Build and Output Settings**: Giữ mặc định:
     * **Build Command**: `npm run build`
     * **Output Directory**: `dist`
     * **Install Command**: `npm install` (hoặc `npm ci`).

---

## BƯỚC 3: CẤU HÌNH BIẾN MÔI TRƯỜNG TRÊN VERCEL

Trước khi bấm nút Deploy, bạn cần mở rộng mục **Environment Variables** trên Vercel để thêm 2 biến kết nối với cơ sở dữ liệu Supabase:

| Tên biến (Key) | Ý nghĩa | Cách lấy giá trị trên Supabase |
|---|---|---|
| `VITE_SUPABASE_URL` | Địa chỉ API của dự án Supabase (có dạng `https://xxxx.supabase.co`) | Vào Supabase Dashboard → Chọn Dự án → **Project Settings** → **API** → Sao chép ô **Project URL**. |
| `VITE_SUPABASE_ANON_KEY` (hoặc `VITE_SUPABASE_PUBLISHABLE_KEY`) | Khóa công khai của dự án để trình duyệt kết nối an toàn qua RLS (Code tự động nhận diện cả 2 tên biến này) | Cùng trang API ở trên → Mục **Project API keys** → Sao chép ô `anon` `public` (hoặc `publishable`). |

> **Lưu ý bảo mật**:
> - Chỉ thêm 2 biến có tiền tố `VITE_` ở trên.
> - **TUYỆT ĐỐI KHÔNG** thêm khóa `service_role` lên Vercel vì khóa này có quyền quản trị tối cao, không được để lộ ra trình duyệt.
> - Chọn tích vào cả 3 môi trường: **Production**, **Preview**, và **Development**.

Sau khi điền đủ 2 biến, bấm nút **Deploy**. Chờ khoảng 1–2 phút cho Vercel hoàn tất quá trình đóng gói và cấp phát tên miền (ví dụ: `https://toeic-cbt-exam.vercel.app`).

---

## BƯỚC 4: CẬP NHẬT CẤU HÌNH SUPABASE & GOOGLE OAUTH

Sau khi có link web trên Vercel (ví dụ: `https://toeic-cbt-exam.vercel.app`), bạn cần báo cho Supabase biết địa chỉ này để cho phép người dùng đăng nhập và nhận email xác nhận.

### 4.1 Cập nhật Site URL và Redirect URLs trên Supabase
1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard).
2. Vào mục **Authentication** (biểu tượng chiếc khiên) → chọn **URL Configuration**.
3. **Site URL**: Xóa địa chỉ `http://localhost:5173`, nhập link Vercel của bạn:
   ```text
   https://toeic-cbt-exam.vercel.app
   ```
4. **Redirect URLs**: Bấm **Add URL** và thêm các đường dẫn sau:
   ```text
   https://toeic-cbt-exam.vercel.app/**
   https://toeic-cbt-exam.vercel.app/reset-password
   https://toeic-cbt-exam.vercel.app/
   ```
5. Bấm nút **Save** để lưu lại.

---

### 4.2 Cập nhật Google OAuth (Nếu sử dụng nút "Đăng nhập với Google")
1. Mở trang quản trị [Google Cloud Console](https://console.cloud.google.com/).
2. Vào mục **APIs & Services** → **Credentials** → bấm vào Client ID mà bạn đã tạo cho web.
3. Tại mục **Authorized JavaScript origins**, bấm **Add URI** và điền:
   ```text
   https://toeic-cbt-exam.vercel.app
   ```
4. Tại mục **Authorized redirect URIs**, đảm bảo đã có link callback của Supabase:
   ```text
   https://<MÃ_PROJECT_CỦA_BẠN>.supabase.co/auth/v1/callback
   ```
5. Bấm **Save**.

---

### 4.3 Kích hoạt quyền Admin đầu tiên (Chỉ làm 1 lần)
Mặc định mọi tài khoản mới đăng ký đều là thí sinh thường (`role = 'user'`). Để có tài khoản quản lý đề thi:
1. Đăng ký tài khoản trên website bằng email của bạn.
2. Mở Supabase Dashboard → vào mục **SQL Editor**.
3. Chạy câu lệnh SQL sau để nâng quyền Admin:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'email_cua_ban@gmail.com');
   ```

---

## BƯỚC 5: KIỂM TRA HỆ THỐNG SAU TRIỂN KHAI (SMOKE TEST)

Mở trình duyệt ở chế độ ẩn danh (Incognito) và truy cập link Vercel để kiểm tra các bước sau:

- [ ] **Trang chủ & Giao diện**: Trang tải mượt mà, đầy đủ hình ảnh, phông chữ chuẩn, không có lỗi hiển thị.
- [ ] **Đăng ký tài khoản mới**: Nhập email, họ tên, mật khẩu tối thiểu 8 ký tự → Đăng ký thành công.
- [ ] **Đăng nhập & Đăng xuất**: Đăng nhập vào hệ thống, hiển thị đúng họ tên ở góc trên, đăng xuất thành công.
- [ ] **Chặn trang trái phép**: Khi chưa đăng nhập, thử gõ trực tiếp `https://domain.vercel.app/profile` hoặc `/admin` → Hệ thống phải tự chuyển về `/login`. Sau khi đăng nhập, phải quay lại đúng trang vừa yêu cầu.
- [ ] **Khóa quyền Admin**: Tài khoản thường vào link `/admin` phải thấy màn hình **403 - Quyền truy cập bị từ chối**.
- [ ] **Làm bài thi & Preload Audio**:
  1. Chọn một đề thi Listening hoặc Full Test.
  2. Xuất hiện hộp thoại **Tải trước âm thanh (Preload)** với thanh phần trăm chạy đến 100%.
  3. Bấm **Vào phòng thi CBT**.
  4. Audio phát rõ ràng, đồng hồ đếm ngược hoạt động.
- [ ] **Kiểm tra khôi phục tiến độ khi tải lại trang**: Đang làm câu 5, nhấn phím `F5` tải lại trang → bài thi vẫn giữ nguyên các câu đã chọn và tiếp tục đếm giờ.
- [ ] **Nộp bài & Xem kết quả**: Bấm nộp bài → xem bảng điểm thành phần (Listening, Reading, tổng điểm /990) và lưu vào trang Lịch sử thi.

---

## BƯỚC 6: CÁCH XỬ LÝ CÁC LỖI THƯỜNG GẶP

### 1. Bấm F5 hoặc gõ URL trực tiếp bị lỗi "404: NOT_FOUND" trên Vercel
* **Nguyên nhân**: Vercel chưa hiểu đây là ứng dụng React Single Page Application (SPA).
* **Khắc phục**: Dự án đã có file [`client/vercel.json`](file:///c:/Users/handa/OneDrive/Documents/Projects/CloneIIG/client/vercel.json) với lệnh `rewrites`. Hãy kiểm tra chắc chắn bạn đã đặt **Root Directory** trên Vercel là `client`.

### 2. Link bấm trong Email kích hoạt hoặc đặt lại mật khẩu nhảy về `localhost:5173`
* **Nguyên nhân**: Chưa đổi Site URL trên Supabase.
* **Khắc phục**: Mở Supabase Dashboard → **Authentication** → **URL Configuration** → Sửa **Site URL** thành link Vercel của bạn (xem lại [Bước 4.1](#41-cập-nhật-site-url-và-redirect-urls-trên-supabase)).

### 3. Báo lỗi "Invalid API Key" hoặc không tải được dữ liệu đề thi
* **Nguyên nhân**: Biến môi trường trên Vercel bị thiếu hoặc sao chép sai chữ cái.
* **Khắc phục**:
  1. Mở Vercel Dashboard → Chọn dự án → **Settings** → **Environment Variables**.
  2. Kiểm tra xem 2 biến `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` đã được thêm chưa và có bị dính khoảng trắng ở hai đầu không.
  3. Sau khi chỉnh sửa biến môi trường, bạn phải vào tab **Deployments** → bấm vào dấu ba chấm `...` ở bản mới nhất → chọn **Redeploy** thì biến mới có hiệu lực.

### 4. Audio bài thi Listening không phát hoặc báo lỗi khi tải trước
* **Nguyên nhân**: Bucket `test-media` trên Supabase chưa được cấp quyền đọc hoặc file âm thanh chưa được tải lên.
* **Khắc phục**:
  1. Vào Supabase Dashboard → **Storage** → kiểm tra bucket `test-media` đã được tạo chưa.
  2. Đảm bảo bạn đã chạy đầy đủ file [`supabase/migrations/001_init.sql`](file:///c:/Users/handa/OneDrive/Documents/Projects/CloneIIG/supabase/migrations/001_init.sql) trong SQL Editor để kích hoạt chính sách bảo mật cho Storage.

---

## BƯỚC 7: CÁCH QUAY LẠI PHIÊN BẢN TRƯỚC (ROLLBACK) TRÊN VERCEL

Nếu bạn vừa đẩy mã nguồn mới lên và phát hiện website bị lỗi, bạn có thể quay về phiên bản chạy ổn định trước đó chỉ trong 5 giây mà không cần sửa code:

1. Đăng nhập vào [Vercel Dashboard](https://vercel.com) và chọn dự án của bạn.
2. Bấm vào tab **Deployments** ở thanh điều hướng trên cùng.
3. Bạn sẽ thấy danh sách tất cả các lần triển khai từ trước đến nay.
4. Tìm bản triển khai hoạt động tốt gần nhất:
   - Bấm vào biểu tượng ba chấm **`...`** ở góc phải của bản đó.
   - Chọn **Promote to Production** (Chỉ định làm bản chính thức).
5. Vercel sẽ ngay lập tức chuyển hướng toàn bộ người dùng về phiên bản ổn định đó mà không gây gián đoạn dịch vụ.
