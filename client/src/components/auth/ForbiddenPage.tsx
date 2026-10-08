import React from 'react';
import { ShieldAlert, Home, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ForbiddenPageProps {
  onBackToHome?: () => void;
  onOpenProfile?: () => void;
}

export const ForbiddenPage: React.FC<ForbiddenPageProps> = ({
  onBackToHome,
  onOpenProfile,
}) => {
  const { user, profile, role, signOut } = useAuth();

  const handleSwitchAccount = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Glow ambient background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-rose-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center shadow-2xl shadow-black/80 ring-1 ring-white/10">
        {/* Warning Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-6 shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-9 h-9 text-rose-400 animate-bounce" />
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-wider mb-3">
          <span>Lỗi 403 • Quyền truy cập bị từ chối</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
          Khu vực Quản trị viên (Admin)
        </h2>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          Trang quản lý và công khai đề thi TOEIC chỉ dành cho tài khoản có vai trò <strong>Quản trị viên (Admin)</strong>.
          Tài khoản của bạn hiện đang ở vai trò <strong>{role === 'user' ? 'Thí sinh (User)' : role}</strong>.
        </p>

        {/* Current user box */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-left text-xs mb-6 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Tài khoản hiện tại:</span>
            <span className="font-semibold text-slate-200">{profile?.full_name || 'Thí sinh'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Email:</span>
            <span className="font-mono text-slate-300">{user?.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Quyền hạn:</span>
            <span className="font-bold text-sky-400">Thí sinh thông thường</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Quay về Trang chủ</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            {onOpenProfile && (
              <button
                type="button"
                onClick={onOpenProfile}
                className="py-2.5 px-3 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>Xem hồ sơ của tôi</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSwitchAccount}
              className="py-2.5 px-3 rounded-xl font-semibold text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Đổi tài khoản khác</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
