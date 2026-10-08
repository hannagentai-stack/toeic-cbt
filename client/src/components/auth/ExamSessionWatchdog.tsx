import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, Mail, RefreshCw, CheckCircle2, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useListeningStore } from '../../store/useListeningStore';
import { useReadingStore } from '../../store/useReadingStore';

export const EMERGENCY_BACKUP_KEY = 'toeic_cbt_emergency_backup';

interface ExamSessionWatchdogProps {
  isExamActive: boolean;
  currentTestCode: string;
  currentSection: string;
}

export interface EmergencyBackupData {
  testCode: string;
  section: string;
  answers: Record<number, string>;
  readingTimeRemaining: number;
  timestamp: string;
}

/**
 * Giám sát phiên đăng nhập trong lúc làm bài thi.
 * Nếu phiên Supabase hết hạn:
 * 1. Tự động sao lưu toàn bộ đáp án và thời gian vào localStorage
 * 2. Hiển thị popup đăng nhập lại tại chỗ (in-place re-login)
 * 3. Sau khi đăng nhập lại thành công, người dùng tiếp tục làm bài ngay lập tức mà không mất đáp án!
 */
export const ExamSessionWatchdog: React.FC<ExamSessionWatchdogProps> = ({
  isExamActive,
  currentTestCode,
  currentSection,
}) => {
  const { isAuthenticated, isLoading, signInWithEmail, signInWithGoogle, user } = useAuth();
  const listeningStore = useListeningStore();
  const readingStore = useReadingStore();

  const [hasShownExpiredModal, setHasShownExpiredModal] = useState<boolean>(false);
  const [email, setEmail] = useState<string>(user?.email || '');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Theo dõi phiên khi đang thi
  useEffect(() => {
    if (!isExamActive || isLoading) return;

    // Nếu đang trong bài thi mà phiên bị mất
    if (!isAuthenticated) {
      // 1. Sao lưu cục bộ toàn bộ tiến độ ngay lập tức
      const backup: EmergencyBackupData = {
        testCode: currentTestCode,
        section: currentSection,
        answers: { ...listeningStore.answers, ...readingStore.answers },
        readingTimeRemaining: readingStore.timeRemainingSeconds,
        timestamp: new Date().toISOString(),
      };

      try {
        localStorage.setItem(EMERGENCY_BACKUP_KEY, JSON.stringify(backup));
        console.warn('[ExamWatchdog] Đã tự động sao lưu tiến độ thi do phiên hết hạn:', backup);
      } catch (err) {
        console.error('[ExamWatchdog] Lỗi ghi sao lưu cục bộ:', err);
      }

      setHasShownExpiredModal(true);
    } else {
      // Khi đã đăng nhập hợp lệ
      setHasShownExpiredModal(false);
    }
  }, [
    isAuthenticated,
    isLoading,
    isExamActive,
    currentTestCode,
    currentSection,
    listeningStore.answers,
    readingStore.answers,
    readingStore.timeRemainingSeconds,
  ]);

  if (!hasShownExpiredModal || isAuthenticated) {
    return null;
  }

  const handleRelogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!email.trim() || !password) {
      setErrorMsg('Vui lòng nhập Email và Mật khẩu.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const { error } = await signInWithEmail(email, password);
    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error);
    } else {
      setHasShownExpiredModal(false);
      setPassword('');
    }
  };

  const handleGoogleRelogin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    const { error } = await signInWithGoogle();
    setIsSubmitting(false);
    if (error) {
      setErrorMsg(error);
    }
  };

  const totalAnsweredCount =
    Object.keys(listeningStore.answers).length + Object.keys(readingStore.answers).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center ring-1 ring-white/10">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
          <ShieldAlert className="w-8 h-8 animate-pulse text-amber-400" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1.5">
          Phiên đăng nhập đã hết hạn
        </h3>

        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs text-left mb-5 flex items-start space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Tiến độ bài thi đã được bảo vệ an toàn!</p>
            <p className="text-[11px] text-emerald-200/80 mt-0.5">
              Đã tự động lưu {totalAnsweredCount} câu trả lời. Vui lòng đăng nhập lại để tiếp tục làm bài mà không mất dữ liệu.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-left mb-4 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRelogin} className="space-y-3.5 text-left">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <Mail className="w-3 h-3" />
              <span>Email tài khoản</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="thi_sinh@example.com"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>Mật khẩu</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang kết nối lại...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập lại & Tiếp tục bài thi</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleGoogleRelogin}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <span>Đăng nhập nhanh với Google</span>
          </button>
        </form>
      </div>
    </div>
  );
};
