import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { EmailConfirmationNotice } from './EmailConfirmationNotice';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigateToLogin,
  onRegisterSuccess,
}) => {
  const { signUpWithEmail } = useAuth();

  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsVerificationEmail, setNeedsVerificationEmail] = useState<string | null>(null);

  // Tính độ mạnh mật khẩu (Tối thiểu 8 ký tự, có chữ và số)
  const isMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const getPasswordStrength = () => {
    if (!password) return { label: '', color: '', width: 'w-0' };
    let score = 0;
    if (isMinLength) score += 1;
    if (hasLetter && hasNumber) score += 1;
    if (hasSpecial || password.length >= 10) score += 1;

    if (score === 1) return { label: 'Yếu', color: 'bg-rose-500 text-rose-400', width: 'w-1/3' };
    if (score === 2) return { label: 'Trung bình', color: 'bg-amber-500 text-amber-400', width: 'w-2/3' };
    return { label: 'Mạnh', color: 'bg-emerald-500 text-emerald-400', width: 'w-full' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên của bạn.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    if (!isMinLength) {
      setErrorMessage('Mật khẩu phải có độ dài tối thiểu 8 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu nhập lại không khớp với mật khẩu đã nhập.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { error, needsEmailVerification } = await signUpWithEmail(email, password, fullName);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error);
    } else {
      if (needsEmailVerification) {
        setNeedsVerificationEmail(email.trim());
      } else {
        if (onRegisterSuccess) {
          onRegisterSuccess();
        } else {
          onNavigateToLogin();
        }
      }
    }
  };

  // Màn hình thông báo xác nhận email sau khi đăng ký
  if (needsVerificationEmail) {
    return (
      <AuthLayout
        title="Đăng ký hoàn tất"
        subtitle="Chỉ còn một bước nữa để kích hoạt tài khoản"
      >
        <EmailConfirmationNotice
          email={needsVerificationEmail}
          onBackToLogin={onNavigateToLogin}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Đăng ký tài khoản"
      subtitle="Tạo tài khoản thí sinh để tham gia thi thử TOEIC chuẩn IIG"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Input Họ và tên */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Họ và tên thí sinh <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              disabled={isLoading}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Input Email */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Địa chỉ Email <span className="text-rose-400">*</span>
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

        {/* Input Mật khẩu */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Mật khẩu (Tối thiểu 8 ký tự) <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Thanh chỉ báo độ mạnh mật khẩu */}
          {password && (
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.color.split(' ')[0]} transition-all duration-300 ${strength.width}`}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>Độ mạnh mật khẩu: <strong className={strength.color.split(' ')[1]}>{strength.label}</strong></span>
                <span className={isMinLength ? 'text-emerald-400' : 'text-slate-500'}>
                  {password.length}/8 ký tự
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input Nhập lại mật khẩu */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Nhập lại mật khẩu <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="mt-1 text-[11px] text-rose-400">
              Mật khẩu nhập lại chưa khớp.
            </p>
          )}
          {confirmPassword && password === confirmPassword && (
            <p className="mt-1 text-[11px] text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mật khẩu trùng khớp.</span>
            </p>
          )}
        </div>

        {/* Nút Tạo tài khoản */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang khởi tạo tài khoản...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Đăng ký tài khoản</span>
            </>
          )}
        </button>
      </form>

      {/* Link sang trang Đăng nhập */}
      <div className="mt-6 text-center text-xs text-slate-400">
        Đã có tài khoản thí sinh?{' '}
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="font-bold text-sky-400 hover:text-sky-300 underline underline-offset-2 transition-colors cursor-pointer"
        >
          Đăng nhập ngay
        </button>
      </div>
    </AuthLayout>
  );
};
