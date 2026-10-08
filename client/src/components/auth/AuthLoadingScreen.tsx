import React from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

export const AuthLoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/15 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
        {/* Animated brand badge */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-2xl shadow-2xl shadow-blue-500/30 ring-2 ring-white/10 animate-pulse">
            IIG
          </div>
          <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-center space-x-2 text-slate-200 font-bold text-base mb-2">
          <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
          <span>Đang kiểm tra phiên đăng nhập...</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Hệ thống đang đồng bộ phiên làm việc an toàn với Supabase Auth. Vui lòng đợi trong giây lát.
        </p>

        <div className="mt-6 w-36 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="w-1/2 h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-full animate-[shimmer_1.5s_infinite]" />
        </div>
      </div>
    </div>
  );
};
