import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface EmailConfirmationNoticeProps {
  email: string;
  onBackToLogin: () => void;
}

export const EmailConfirmationNotice: React.FC<EmailConfirmationNoticeProps> = ({
  email,
  onBackToLogin,
}) => {
  const { resendVerificationEmail } = useAuth();
  const [countdown, setCountdown] = useState<number>(60);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendStatus, setResendStatus] = useState<{ success?: string; error?: string } | null>(null);

  // Bộ đếm ngược 60 giây chống spam gửi lại email
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setResendStatus(null);

    const { error } = await resendVerificationEmail(email);
    setIsResending(false);

    if (error) {
      setResendStatus({ error });
    } else {
      setResendStatus({
        success: 'Đã gửi lại email xác nhận! Vui lòng kiểm tra lại hộp thư của bạn.',
      });
      setCountdown(60);
    }
  };

  return (
    <div className="text-center py-2">
      {/* Icon minh họa */}
      <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mx-auto flex items-center justify-center mb-5 shadow-lg shadow-blue-500/10">
        <Mail className="w-8 h-8 animate-pulse text-blue-400" />
      </div>

      <h3 className="text-xl font-bold text-white mb-2">
        Hãy kiểm tra email để xác nhận
      </h3>

      <p className="text-sm text-slate-300 leading-relaxed mb-4">
        Chúng tôi đã gửi một liên kết kích hoạt tài khoản đến địa chỉ email:
      </p>

      <div className="bg-slate-800/80 border border-slate-700 rounded-xl py-2 px-3 mb-5 inline-block max-w-full">
        <span className="text-sky-300 font-mono text-sm font-semibold break-all select-all">
          {email || 'email của bạn'}
        </span>
      </div>

      <div className="bg-blue-950/40 border border-blue-800/50 rounded-xl p-3 text-xs text-slate-300 text-left mb-6 space-y-1.5">
        <div className="flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>Nhấp vào liên kết trong email để hoàn tất kích hoạt tài khoản.</span>
        </div>
        <div className="flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>Nếu không thấy thư, hãy kiểm tra thêm mục <strong>Thư rác (Spam)</strong> hoặc <strong>Quảng cáo (Promotions)</strong>.</span>
        </div>
      </div>

      {resendStatus?.success && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 text-left">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{resendStatus.success}</span>
        </div>
      )}

      {resendStatus?.error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 text-left">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{resendStatus.error}</span>
        </div>
      )}

      {/* Nút gửi lại email xác nhận */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={countdown > 0 || isResending}
          className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
        >
          {isResending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              <span>Đang gửi lại email...</span>
            </>
          ) : countdown > 0 ? (
            <span>Gửi lại email sau ({countdown}s)</span>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 text-blue-400" />
              <span>Gửi lại email xác nhận</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Đăng nhập</span>
        </button>
      </div>
    </div>
  );
};
