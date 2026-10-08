import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  LogOut,
  ShieldCheck,
  ChevronDown,
  History,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserProfileModal } from './UserProfileModal';

interface UserMenuProps {
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
  onOpenAdmin?: () => void;
  onOpenHistory?: () => void;
  onOpenProfile?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  onOpenLogin,
  onOpenRegister,
  onOpenAdmin,
  onOpenHistory,
  onOpenProfile,
}) => {
  const { user, profile, role, isAuthenticated, signOut, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="h-9 w-24 bg-slate-800/80 rounded-xl animate-pulse" />
    );
  }

  // Trường hợp chưa đăng nhập
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center space-x-2">
        {onOpenLogin && (
          <button
            type="button"
            onClick={onOpenLogin}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-sky-400" />
            <span>Đăng nhập</span>
          </button>
        )}
        {onOpenRegister && (
          <button
            type="button"
            onClick={onOpenRegister}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Đăng ký</span>
          </button>
        )}
      </div>
    );
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Thí sinh';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
    window.location.reload();
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2.5 px-2.5 py-1.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          aria-expanded={isOpen}
        >
          {/* Avatar Initials */}
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            {initials}
          </div>

          {/* User Info */}
          <div className="hidden sm:block text-left max-w-[120px] md:max-w-[160px]">
            <div className="text-xs font-bold text-white truncate leading-tight">
              {displayName}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center space-x-1">
              {role === 'admin' ? (
                <span className="text-amber-400 font-bold flex items-center space-x-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>Admin</span>
                </span>
              ) : (
                <span className="text-sky-300 truncate">
                  {profile?.candidate_id || 'Thí sinh'}
                </span>
              )}
            </div>
          </div>

          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-white' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/80 py-2 z-50 ring-1 ring-white/10 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header thông tin người dùng */}
            <div className="px-4 py-3 border-b border-slate-800">
              <p className="text-xs text-slate-400">Đang đăng nhập với tư cách</p>
              <p className="text-sm font-bold text-white truncate mt-0.5">{displayName}</p>
              <p className="text-xs text-slate-400 font-mono truncate">{user.email}</p>
              {role === 'admin' && (
                <div className="mt-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span>Tài khoản Quản trị viên</span>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="py-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenProfile) {
                    onOpenProfile();
                  } else {
                    setIsProfileModalOpen(true);
                  }
                }}
                className="w-full px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center space-x-2.5 text-left transition-colors cursor-pointer"
              >
                <User className="w-4 h-4 text-blue-400" />
                <span className="font-semibold">Hồ sơ cá nhân & SBD</span>
              </button>

              {onOpenHistory && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenHistory();
                  }}
                  className="w-full px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center space-x-2.5 text-left transition-colors cursor-pointer"
                >
                  <History className="w-4 h-4 text-sky-400" />
                  <span className="font-semibold">Lịch sử bài thi của tôi</span>
                </button>
              )}

              {role === 'admin' && onOpenAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenAdmin();
                  }}
                  className="w-full px-4 py-2.5 text-amber-300 hover:text-amber-200 hover:bg-slate-800 flex items-center space-x-2.5 text-left transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold">Quản lý & Công khai đề (Admin)</span>
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-slate-800 my-1" />

            {/* Đăng xuất */}
            <div className="py-1 text-xs">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center space-x-2.5 text-left transition-colors cursor-pointer font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
