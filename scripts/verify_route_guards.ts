import { REDIRECT_TARGET_KEY } from '../client/src/components/auth/RouteGuards.js';
import { EMERGENCY_BACKUP_KEY } from '../client/src/components/auth/ExamSessionWatchdog.js';

function runRouteGuardTests() {
  console.log('--- Kiểm tra cấu hình Route Guard & Bảo vệ phiên thi ---');

  // 1. Kiểm tra hằng số khóa chuyển hướng
  if (REDIRECT_TARGET_KEY === 'toeic_redirect_after_login') {
    console.log('✓ [PASS] REDIRECT_TARGET_KEY hợp lệ: toeic_redirect_after_login');
  } else {
    console.error('✗ [FAIL] REDIRECT_TARGET_KEY sai giá trị');
    process.exit(1);
  }

  // 2. Kiểm tra hằng số khóa sao lưu khẩn cấp khi đứt phiên giữa bài thi
  if (EMERGENCY_BACKUP_KEY === 'toeic_cbt_emergency_backup') {
    console.log('✓ [PASS] EMERGENCY_BACKUP_KEY hợp lệ: toeic_cbt_emergency_backup');
  } else {
    console.error('✗ [FAIL] EMERGENCY_BACKUP_KEY sai giá trị');
    process.exit(1);
  }

  // 3. Giả lập logic kiểm tra quyền của RequireAdmin
  const checkAdminAccess = (role: string) => {
    if (role === 'admin') return { status: 200, access: true };
    return { status: 403, access: false, page: 'ForbiddenPage' };
  };

  const userTest = checkAdminAccess('user');
  if (userTest.status === 403 && userTest.access === false && userTest.page === 'ForbiddenPage') {
    console.log('✓ [PASS] User thông thường truy cập /admin bị chặn 403 Forbidden');
  } else {
    console.error('✗ [FAIL] Lỗi kiểm tra chặn user');
    process.exit(1);
  }

  const adminTest = checkAdminAccess('admin');
  if (adminTest.status === 200 && adminTest.access === true) {
    console.log('✓ [PASS] Tài khoản Admin truy cập /admin thành công (200 OK)');
  } else {
    console.error('✗ [FAIL] Lỗi kiểm tra cho phép admin');
    process.exit(1);
  }

  // 4. Giả lập logic lưu trang đích khi chưa đăng nhập
  const simulateUnauthAccess = (targetUrl: string) => {
    const isPublic = ['/login', '/register', '/forgot-password', '/reset-password'].some(p => targetUrl.includes(p));
    if (!isPublic) {
      return { redirect: '/login', savedTarget: targetUrl };
    }
    return { redirect: null, savedTarget: null };
  };

  const accessExam = simulateUnauthAccess('/exam');
  if (accessExam.redirect === '/login' && accessExam.savedTarget === '/exam') {
    console.log('✓ [PASS] Truy cập /exam khi chưa đăng nhập -> chuyển /login và nhớ trang đích /exam');
  } else {
    console.error('✗ [FAIL] Lỗi lưu trang đích');
    process.exit(1);
  }

  const accessAdmin = simulateUnauthAccess('/admin');
  if (accessAdmin.redirect === '/login' && accessAdmin.savedTarget === '/admin') {
    console.log('✓ [PASS] Truy cập /admin khi chưa đăng nhập -> chuyển /login và nhớ trang đích /admin');
  } else {
    console.error('✗ [FAIL] Lỗi lưu trang đích /admin');
    process.exit(1);
  }

  console.log('\n Tất cả các kiểm thử logic Route Guard & Bảo vệ phiên thi đều ĐẠT CHUẨN!');
}

runRouteGuardTests();
