import React, { useState } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { useAuth } from '../../context/AuthContext';

interface ForgotPasswordPageProps {
  onNavigateToLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onNavigateToLogin,
}) => {
  const { resetPasswordForEmail } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email đã đăng ký.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await resetPasswordForEmail(email);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error);
    } else {
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout
        title="Đã gửi email khôi phục"
        subtitle="Vui lòng kiểm tra hộp thư của bạn"
      >
        <div className="text-center py-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>

          <h3 className="text-lg font-bold text-white mb-2">
            Kiểm tra hộp thư đến
          </h3>

          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            Chúng tôi đã gửi hướng dẫn và liên kết đặt lại mật khẩu đến:
          </p>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl py-2 px-3 mb-5 inline-block max-w-full">
            <span className="text-sky-300 font-mono text-sm font-semibold break-all">
              {email}
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-6">
            Nhấp vào liên kết trong email để tạo mật khẩu mới. Nếu không thấy thư trong vài phút, hãy kiểm tra mục Spam hoặc Thư rác.
          </p>

          <button
            type="button"
            onClick={onNavigateToLogin}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang Đăng nhập</span>
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Quên mật khẩu"
      subtitle="Nhập email tài khoản để nhận liên kết đặt lại mật khẩu mới"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Email tài khoản của bạn
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="thi_sinh@example.com"
              disabled={isLoading}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang gửi email...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Gửi liên kết khôi phục</span>
            </>
          )}
        </button>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Đăng nhập</span>
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};
