import React, { useState } from 'react';
import { X, User, Calendar, Shield, Mail, CheckCircle2, AlertCircle, RefreshCw, Save, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, user, updateProfile, role } = useAuth();

  const [fullName, setFullName] = useState<string>(profile?.full_name || '');
  const [dateOfBirth, setDateOfBirth] = useState<string>(profile?.date_of_birth || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setMessage(null);

    const { error } = await updateProfile({
      full_name: fullName,
      date_of_birth: dateOfBirth,
    });

    setIsSaving(false);

    if (error) {
      setMessage({ text: error, type: 'error' });
    } else {
      setMessage({ text: 'Cập nhật hồ sơ cá nhân thành công!', type: 'success' });
      // Đồng bộ vào localStorage để màn hình chuẩn bị thi tự động dùng thông tin mới nhất
      try {
        localStorage.setItem(
          'toeic_saved_candidate',
          JSON.stringify({
            fullName: fullName.trim(),
            dateOfBirth: dateOfBirth.trim(),
            candidateId: profile?.candidate_id,
            email: user?.email,
          })
        );
      } catch {}
    }
  };

  const initials = (fullName || user?.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden ring-1 ring-white/10">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-base">
              {initials}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Hồ sơ thí sinh</h3>
              <p className="text-xs text-slate-400">Thông tin tài khoản và dự thi CBT</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {message && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-center space-x-2.5 ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Vai trò & Số báo danh (Cố định) */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
            <div>
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Shield className="w-3 h-3 text-sky-400" />
                <span>Vai trò</span>
              </span>
              {role === 'admin' ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ★ Quản trị viên (Admin)
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Thí sinh (User)
                </span>
              )}
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Award className="w-3 h-3 text-emerald-400" />
                <span>Số báo danh (SBD)</span>
              </span>
              <span className="font-mono text-xs font-bold text-slate-200">
                {profile?.candidate_id || 'Chưa cấp'}
              </span>
            </div>
          </div>

          {/* Email (Readonly) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Địa chỉ Email</span>
            </label>
            <input
              type="text"
              readOnly
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 text-sm font-mono cursor-not-allowed select-all"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Email dùng để nhận thông báo và liên kết đăng nhập.
            </p>
          </div>

          {/* Họ và tên (Editable) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Họ và tên thí sinh</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              disabled={isSaving}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Ngày sinh (Editable) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Ngày sinh (Định dạng YYYY-MM-DD hoặc DD/MM/YYYY)</span>
            </label>
            <input
              type="text"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              placeholder="1998-05-20"
              disabled={isSaving}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
