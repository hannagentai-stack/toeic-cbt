import React, { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  Award,
  Mail,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Home,
  ArrowRight,
  History,
  Dices,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { attemptService } from '../../services/attemptService';
import { useExamSessionStore } from '../../store/useExamSessionStore';
import { UserMenu } from './UserMenu';

interface ProfilePageProps {
  onBackToHome: () => void;
  onOpenHistory?: () => void;
  onStartExam?: () => void;
  onOpenAdmin?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onBackToHome,
  onOpenHistory,
  onStartExam,
  onOpenAdmin,
}) => {
  const { user, profile, role, updateProfile } = useAuth();
  const allAttempts = attemptService.getAllAttempts();
  const latestAttempt = attemptService.getLatestAttempt();

  const [fullName, setFullName] = useState<string>(profile?.full_name || '');
  const [dateOfBirth, setDateOfBirth] = useState<string>(profile?.date_of_birth || '');
  const [candidateId, setCandidateId] = useState<string>(profile?.candidate_id || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Đồng bộ lại khi profile từ Supabase được tải về
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setDateOfBirth(profile.date_of_birth || '');
      setCandidateId(profile.candidate_id || '');
    }
  }, [profile]);

  // Sinh ngẫu nhiên số báo danh chuẩn định dạng TOEIC CBT
  const handleGenerateRandomCandidateId = () => {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const newId = `SBD-${randomDigits}`;
    setCandidateId(newId);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!fullName.trim()) {
      setFeedback({ type: 'error', message: 'Họ và tên thí sinh không được để trống.' });
      return;
    }

    if (!candidateId.trim()) {
      setFeedback({ type: 'error', message: 'Số báo danh không được để trống.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const { error } = await updateProfile({
      full_name: fullName.trim(),
      date_of_birth: dateOfBirth.trim(),
      candidate_id: candidateId.trim(),
    });

    setIsSaving(false);

    if (error) {
      setFeedback({ type: 'error', message: `Lỗi khi lưu: ${error}` });
    } else {
      setFeedback({
        type: 'success',
        message: '✓ Cập nhật thông tin thí sinh thành công! Thông tin này đã sẵn sàng cho phòng thi.',
      });

      // Tự động cập nhật thông tin thí sinh vào session store
      useExamSessionStore.getState().setCandidate({
        fullName: fullName.trim(),
        dateOfBirth: dateOfBirth.trim(),
        candidateId: candidateId.trim(),
        email: user?.email,
      });

      // Đồng bộ vào localStorage để màn hình chuẩn bị thi tự động dùng thông tin mới nhất
      try {
        localStorage.setItem(
          'toeic_saved_candidate',
          JSON.stringify({
            fullName: fullName.trim(),
            dateOfBirth: dateOfBirth.trim(),
            candidateId: candidateId.trim(),
            email: user?.email,
          })
        );
      } catch {}
    }
  };

  const displayName = fullName || user?.email?.split('@')[0] || 'Thí sinh';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Tính điểm cao nhất từ lịch sử
  const highestScore = allAttempts.reduce((max, att) => {
    return Math.max(max, att.scoreResult.totalScore || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform cursor-pointer"
              title="Về Trang chủ"
            >
              IIG
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-white text-base tracking-tight">
                  HỒ SƠ THÍ SINH
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  CBT PROFILE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Quản lý thông tin cá nhân và dữ liệu thi thử TOEIC
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Trang chủ</span>
            </button>
            <UserMenu
              onOpenAdmin={onOpenAdmin}
              onOpenHistory={onOpenHistory}
            />
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Banner hồ sơ */}
        <div className="bg-gradient-to-r from-blue-900/50 via-slate-900 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 w-80 h-full bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 relative z-10 text-center sm:text-left">
            {/* Avatar Initials */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-2xl flex items-center justify-center shadow-xl shadow-blue-600/30 ring-2 ring-white/10 shrink-0">
              {initials}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {displayName}
                </h1>
                {role === 'admin' ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Shield className="w-3 h-3 text-amber-400" />
                    <span>Quản trị viên (Admin)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    <Award className="w-3 h-3 text-blue-400" />
                    <span>Thí sinh CBT</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
                <div className="flex items-center space-x-1 font-mono">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center space-x-1 font-mono text-sky-400 font-semibold">
                  <span>SBD: {profile?.candidate_id || 'Chưa cấp'}</span>
                </div>
              </div>
            </div>

            {onStartExam && (
              <button
                type="button"
                onClick={onStartExam}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
              >
                <span>Vào thi ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-center">
            <div className="p-3 bg-slate-950/40 rounded-2xl border border-slate-800/50">
              <span className="block text-[11px] text-slate-400 uppercase font-semibold">Số lần thi</span>
              <span className="text-xl font-black text-white mt-0.5 block">{allAttempts.length}</span>
            </div>
            <div className="p-3 bg-slate-950/40 rounded-2xl border border-slate-800/50">
              <span className="block text-[11px] text-slate-400 uppercase font-semibold">Điểm cao nhất</span>
              <span className="text-xl font-black text-emerald-400 mt-0.5 block">
                {highestScore > 0 ? `${highestScore}/990` : '—'}
              </span>
            </div>
            <div className="p-3 bg-slate-950/40 rounded-2xl border border-slate-800/50">
              <span className="block text-[11px] text-slate-400 uppercase font-semibold">Lần thi gần nhất</span>
              <span className="text-sm font-bold text-sky-400 mt-1 block truncate">
                {latestAttempt ? latestAttempt.testTitle : 'Chưa thi'}
              </span>
            </div>
          </div>
        </div>

        {/* Form chỉnh sửa thông tin */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Chỉnh sửa thông tin thí sinh</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Thông tin này sẽ tự động điền vào bước &quot;Thông tin thí sinh&quot; khi bạn bắt đầu bài thi
              </p>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center space-x-3 mb-6 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            {/* Họ và tên */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <User className="w-4 h-4 text-blue-400" />
                <span>Họ và tên thí sinh <span className="text-rose-400">*</span></span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: NGUYỄN VĂN AN"
                disabled={isSaving}
                className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="mt-1.5 text-[11px] text-slate-500">
                Tên hiển thị trên bài thi CBT và chứng nhận kết quả.
              </p>
            </div>

            {/* Ngày sinh */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Ngày sinh (Định dạng YYYY-MM-DD hoặc DD/MM/YYYY)</span>
              </label>
              <input
                type="text"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                placeholder="2000-01-15"
                disabled={isSaving}
                className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Số báo danh (SBD) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Số báo danh (SBD) <span className="text-rose-400">*</span></span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateRandomCandidateId}
                  className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Tạo số ngẫu nhiên</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                placeholder="SBD-882901"
                disabled={isSaving}
                className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white font-mono placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="mt-1.5 text-[11px] text-slate-500">
                Mã số báo danh định danh bài thi trên máy tính của bạn.
              </p>
            </div>

            {/* Email tài khoản (Không thể sửa) */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Mail className="w-4 h-4 text-slate-500" />
                <span>Địa chỉ Email liên kết tài khoản</span>
              </label>
              <input
                type="text"
                readOnly
                value={user?.email || ''}
                className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-400 font-mono text-sm cursor-not-allowed select-all"
              />
            </div>

            {/* Submit button */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-800">
              {onOpenHistory && (
                <button
                  type="button"
                  onClick={onOpenHistory}
                  className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-sky-400" />
                  <span>Xem lịch sử làm bài →</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 disabled:opacity-50 ml-auto cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang lưu thông tin...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu thông tin thí sinh</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
