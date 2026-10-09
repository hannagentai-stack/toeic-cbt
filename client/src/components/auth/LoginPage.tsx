import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, RefreshCw } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { EmailConfirmationNotice } from './EmailConfirmationNotice';
import { translateAuthError } from '../../utils/authErrorTranslator';

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToRegister,
  onNavigateToForgotPassword,
  onLoginSuccess,
}) => {
  const { isAuthenticated, isLoading: isAuthLoading, signInWithEmail, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  // 1. Tự động chuyển hướng nếu người dùng đã có phiên đăng nhập hợp lệ
  useEffect(() => {
    console.log('[LoginPage] Kiểm tra phiên:', { isAuthLoading, isAuthenticated });
    if (!isAuthLoading && isAuthenticated) {
      console.log('[LoginPage] Phát hiện đã đăng nhập -> tự động chuyển tiếp trang');
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }
  }, [isAuthLoading, isAuthenticated, onLoginSuccess]);

  // 2. Bắt lỗi trả về từ URL (OAuth callback error) hoặc sessionStorage và hiển thị tiếng Việt
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(
      window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
    );
    const urlError =
      urlParams.get('error') ||
      urlParams.get('error_description') ||
      hashParams.get('error') ||
      hashParams.get('error_description');

    const sessionError = sessionStorage.getItem('toeic_oauth_error');
    const rawError = urlError || sessionError;

    if (rawError) {
      sessionStorage.removeItem('toeic_oauth_error');
      console.warn('[LoginPage] Hiển thị lỗi xác thực:', rawError);
      const translated = translateAuthError({ message: rawError });
      setErrorMessage(translated);

      if (urlError) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isGoogleLoading) return;

    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await signInWithEmail(email, password);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error);
      if (error.toLowerCase().includes('chưa được xác nhận')) {
        setUnconfirmedEmail(email.trim());
      }
    } else {
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }
  };

  const handleGoogleSignIn = async () => {
    if (isLoading || isGoogleLoading) return;

    setIsGoogleLoading(true);
    setErrorMessage(null);

    const { error } = await signInWithGoogle();
    setIsGoogleLoading(false);

    if (error) {
      setErrorMessage(error);
    }
  };

  // Nếu người dùng gặp lỗi email chưa xác nhận, cho phép chuyển sang xem màn hình xác nhận
  if (unconfirmedEmail) {
    return (
      <AuthLayout
        title="Xác nhận tài khoản"
        subtitle="Kích hoạt email để bắt đầu thi thử TOEIC"
      >
        <EmailConfirmationNotice
          email={unconfirmedEmail}
          onBackToLogin={() => {
            setUnconfirmedEmail(null);
            setErrorMessage(null);
          }}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Đăng nhập hệ thống"
      subtitle="Đăng nhập tài khoản thí sinh để tham gia thi thử và lưu lịch sử"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{errorMessage}</span>
              {errorMessage.toLowerCase().includes('chưa được xác nhận') && (
                <button
                  type="button"
                  onClick={() => setUnconfirmedEmail(email)}
                  className="block mt-1 font-semibold text-rose-200 underline hover:text-white cursor-pointer"
                >
                  Bấm vào đây để gửi lại email xác nhận →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Input Email */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Địa chỉ Email
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
              disabled={isLoading || isGoogleLoading}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Input Mật khẩu */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Mật khẩu
            </label>
            <button
              type="button"
              onClick={onNavigateToForgotPassword}
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors font-medium cursor-pointer"
            >
              Quên mật khẩu?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading || isGoogleLoading}
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
        </div>

        {/* Nút Đăng nhập */}
        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang đăng nhập...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập</span>
            </>
          )}
        </button>

        {/* Phân cách Hoặc */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-3 text-slate-500 font-semibold tracking-wider">
              Hoặc tiếp tục với
            </span>
          </div>
        </div>

        {/* Đăng nhập với Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
          className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700/90 text-white border border-slate-700/90 shadow-sm transition-all flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isGoogleLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
              <span>Đang kết nối Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Đăng nhập với Google</span>
            </>
          )}
        </button>
      </form>

      {/* Link sang trang Đăng ký */}
      <div className="mt-6 text-center text-xs text-slate-400">
        Chưa có tài khoản thí sinh?{' '}
        <button
          type="button"
          onClick={onNavigateToRegister}
          className="font-bold text-sky-400 hover:text-sky-300 underline underline-offset-2 transition-colors cursor-pointer"
        >
          Đăng ký tài khoản mới
        </button>
      </div>
    </AuthLayout>
  );
};
