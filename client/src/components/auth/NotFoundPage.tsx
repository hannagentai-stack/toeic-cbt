import React from 'react';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  onBackToHome: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onBackToHome }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center shadow-2xl shadow-black/80 ring-1 ring-white/10">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mx-auto flex items-center justify-center mb-6 shadow-lg shadow-blue-500/10">
          <FileQuestion className="w-9 h-9 text-blue-400 animate-pulse" />
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-3">
          <span>Lỗi 404 • Trang không tồn tại</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
          Không tìm thấy trang yêu cầu
        </h2>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          Đường dẫn bạn vừa truy cập không tồn tại hoặc đã được chuyển sang địa chỉ khác trong hệ thống thi TOEIC CBT.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Về Trang chủ thi thử</span>
          </button>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang trước</span>
          </button>
        </div>
      </div>
    </div>
  );
};
