import React from 'react';
import { Clock, Send, WifiOff, CheckCircle2, RefreshCw } from 'lucide-react';

interface CbtTopBarProps {
  candidateName: string;
  candidateId: string;
  timeFormatted: string;
  currentPartTitle: string;
  currentQuestionNumber?: number;
  totalQuestions?: number;
  answeredCount?: number;
  fontSizeScale?: 'NORMAL' | 'LARGE' | 'HUGE';
  onIncreaseFontSize?: () => void;
  onDecreaseFontSize?: () => void;
  onSubmitClick: () => void;
  isOffline?: boolean;
  saveStatus?: 'saved' | 'saving' | 'offline';
}

export const CbtTopBar: React.FC<CbtTopBarProps> = ({
  candidateName,
  candidateId,
  timeFormatted,
  currentPartTitle,
  currentQuestionNumber = 1,
  totalQuestions = 100,
  answeredCount = 0,
  fontSizeScale = 'NORMAL',
  onIncreaseFontSize,
  onDecreaseFontSize,
  onSubmitClick,
  isOffline = false,
  saveStatus = 'saved',
}) => {
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <header className="sticky top-0 z-40 bg-iig-navy text-white flex flex-col border-b border-slate-700 select-none shadow-md flex-shrink-0">
      <div className="h-12 px-4 md:px-5 flex items-center justify-between">
        {/* 1. TÊN THÍ SINH, PART VÀ VỊ TRÍ CÂU */}
        <div className="flex items-center space-x-3 text-xs md:text-sm">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-black text-xs shadow-inner">
            IIG
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-sky-500/20 text-sky-200 border border-sky-400/30 rounded text-xs font-bold uppercase">
              {currentPartTitle}
            </span>
            <span className="bg-slate-800 border border-slate-700 text-sky-300 font-mono font-bold text-xs px-2 py-0.5 rounded shadow-inner">
              Câu {currentQuestionNumber}/{totalQuestions}
            </span>
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-slate-800/90 border border-slate-700 text-xs font-mono shadow-inner">
              <span className="font-bold text-slate-100 truncate max-w-[140px] sm:max-w-none">
                {candidateName}
              </span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-sky-300 font-bold hidden sm:inline">
                SBD: {candidateId}
              </span>
            </div>
          </div>
        </div>

        {/* 2. ĐỒNG HỒ ĐẾM NGƯỢC CỐ ĐỊNH Ở GIỮA */}
        <div className="flex items-center space-x-2 bg-slate-900/90 px-3.5 py-1 rounded-md border border-slate-700 shadow-inner">
          <Clock className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <span className="text-[11px] uppercase text-slate-400 font-bold hidden sm:inline">
            Thời gian:
          </span>
          <span className="text-base font-mono font-bold tracking-wider text-white">
            {timeFormatted}
          </span>
        </div>

        {/* 3. TIẾN ĐỘ & NÚT NỘP BÀI */}
        <div className="flex items-center space-x-3">
          {/* Zoom font size */}
          {onIncreaseFontSize && onDecreaseFontSize && (
            <div className="flex items-center space-x-1 bg-slate-900/80 border border-slate-700 rounded p-0.5">
              <button
                type="button"
                onClick={onDecreaseFontSize}
                disabled={fontSizeScale === 'NORMAL'}
                title="Giảm cỡ chữ (A-)"
                className="px-1.5 py-0.5 rounded text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                A-
              </button>
              <span className="text-[10px] font-mono text-sky-300 font-bold px-1 select-none">
                {fontSizeScale === 'NORMAL' ? '100%' : fontSizeScale === 'LARGE' ? '115%' : '130%'}
              </span>
              <button
                type="button"
                onClick={onIncreaseFontSize}
                disabled={fontSizeScale === 'HUGE'}
                title="Tăng cỡ chữ (A+)"
                className="px-1.5 py-0.5 rounded text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                A+
              </button>
            </div>
          )}

          <span className="text-xs text-slate-300 hidden md:inline">
            Đã làm: <strong className="text-emerald-400 font-mono">{answeredCount}/{totalQuestions}</strong>
          </span>

          {/* Trạng thái lưu tự động / ngoại tuyến */}
          <div className="hidden lg:flex items-center">
            {isOffline ? (
              <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Lưu máy (Offline)</span>
              </span>
            ) : saveStatus === 'saving' ? (
              <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Đã tự lưu</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onSubmitClick}
            className="flex items-center space-x-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nộp bài</span>
          </button>
        </div>
      </div>

      {/* 4. THANH TIẾN ĐỘ (PROGRESS BAR) */}
      <div className="w-full bg-slate-800 h-1 overflow-hidden">
        <div
          className="bg-emerald-400 h-full transition-all duration-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  );
};

