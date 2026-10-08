/**
 * Chuyển đổi các mã lỗi kỹ thuật từ Supabase Auth sang thông báo tiếng Việt thân thiện
 */
export function translateAuthError(error: any): string {
  if (!error) return 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';

  const rawMessage = (error.message || error.error_description || String(error)).toLowerCase();

  // 1. Lỗi mạng / mất kết nối
  if (
    rawMessage.includes('failed to fetch') ||
    rawMessage.includes('networkerror') ||
    rawMessage.includes('network error') ||
    rawMessage.includes('load failed') ||
    (typeof navigator !== 'undefined' && navigator.onLine === false)
  ) {
    return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng Internet của bạn.';
  }

  // 2. Sai tài khoản / mật khẩu
  if (
    rawMessage.includes('invalid login credentials') ||
    rawMessage.includes('invalid credentials') ||
    rawMessage.includes('invalid email or password')
  ) {
    return 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
  }

  // 3. Email chưa được xác nhận
  if (rawMessage.includes('email not confirmed')) {
    return 'Email của bạn chưa được xác nhận. Vui lòng kiểm tra hộp thư đến (hoặc mục Spam/Rác) để nhấp vào link kích hoạt tài khoản.';
  }

  // 4. Email đã tồn tại
  if (
    rawMessage.includes('user already registered') ||
    rawMessage.includes('already exists') ||
    rawMessage.includes('email already in use')
  ) {
    return 'Địa chỉ email này đã có tài khoản trên hệ thống. Vui lòng đăng nhập hoặc sử dụng chức năng Quên mật khẩu.';
  }

  // 5. Giới hạn tần suất gửi email / quá nhiều lần thử (Rate limit)
  if (
    rawMessage.includes('rate limit') ||
    rawMessage.includes('too many requests') ||
    rawMessage.includes('over_email_send_rate_limit') ||
    rawMessage.includes('security purposes, you can only request')
  ) {
    return 'Bạn đã thực hiện thao tác quá nhiều lần hoặc quá nhanh. Vì lý do bảo mật, vui lòng đợi ít phút rồi thử lại.';
  }

  // 6. Độ dài mật khẩu không đủ
  if (
    rawMessage.includes('password should be at least') ||
    rawMessage.includes('weak password')
  ) {
    return 'Mật khẩu chưa đủ độ mạnh (cần tối thiểu 8 ký tự bao gồm chữ và số).';
  }

  // 7. Token / Link hết hạn hoặc không hợp lệ
  if (
    rawMessage.includes('session missing') ||
    rawMessage.includes('token has expired') ||
    rawMessage.includes('invalid token') ||
    rawMessage.includes('otp expired')
  ) {
    return 'Liên kết xác thực hoặc đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu gửi lại email mới.';
  }

  // 8. Định dạng email không hợp lệ
  if (rawMessage.includes('invalid email') || rawMessage.includes('unable to validate email')) {
    return 'Định dạng địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.';
  }

  // 9. Lỗi Google OAuth
  if (rawMessage.includes('oauth') || rawMessage.includes('google')) {
    return 'Đăng nhập bằng tài khoản Google thất bại hoặc đã bị hủy. Vui lòng thử lại.';
  }

  // Thông báo fallback
  return error.message || 'Thao tác không thành công. Vui lòng thử lại sau.';
}
