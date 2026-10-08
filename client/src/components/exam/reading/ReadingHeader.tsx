import React, { useEffect } from 'react';
import { Clock, Send, BookOpen, Flag } from 'lucide-react';
import { useReadingStore } from '../../../store/useReadingStore';

interface ReadingHeaderProps {
  testTitle: string;
  totalReadingQuestions: number;
}

export const ReadingHeader: React.FC<ReadingHeaderProps> = ({
  testTitle,
  totalReadingQuestions,
}) => {
  const {
    timeRemainingSeconds,
    decrementTimer,
    isTimeRunning,
    answers,
    flaggedQuestions,
    openSubmitModal,
    currentQuestionNumber,
    fontSizeScale,
    increaseFontSize,
    decreaseFontSize,
  } = useReadingStore();

  // Đếm ngược mỗi giây
  useEffect(() => {
    if (!isTimeRunning) return;
    const interval = setInterval(() => {
      decrementTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimeRunning, decrementTimer]);

  // Định dạng thời gian MM:SS
  const minutes = Math.floor(timeRemainingSeconds / 60);
  const seconds = timeRemainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isLowTime = timeRemainingSeconds <= 300; // Còn dưới 5 phút
  const isUrgent = timeRemainingSeconds <= 60;  // Còn dưới 1 phút

  const answeredCount = Object.keys(answers).length;
  const currentReadingIndex = currentQuestionNumber > 100 ? currentQuestionNumber - 100 : currentQuestionNumber;
  const progressPercent = totalReadingQuestions > 0 ? Math.round((answeredCount / totalReadingQuestions) * 100) : 0;

  const currentPartTitle =
    currentQuestionNumber <= 130
      ? 'Part 5: Incomplete Sentences'
      : currentQuestionNumber <= 146
        ? 'Part 6: Text Completion'
        : 'Part 7: Reading Comprehension';

  return (
    <header className="sticky top-0 z-40 bg-iig-navy text-white shadow-md border-b border-iig-dark select-none flex flex-col">
      <div className="px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Thông tin bài thi & Part */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-iig-accent flex items-center justify-center font-bold text-white text-xs shadow-inner">
            IIG
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-white/80 font-bold text-xs hidden xl:inline">
              {testTitle} •
            </span>
            <span className="bg-sky-500/20 text-sky-200 border border-sky-400/30 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
              {currentPartTitle}
            </span>
            <span className="bg-slate-800 border border-slate-700 text-sky-300 font-mono font-bold text-xs md:text-sm px-2.5 py-1 rounded-md shadow-inner">
              Câu {currentReadingIndex}/{totalReadingQuestions}
            </span>
            <span className="text-slate-400 text-xs font-mono hidden md:inline">
              (#{currentQuestionNumber}/200)
            </span>
          </div>
        </div>

        {/* ĐỒNG HỒ ĐẾM NGƯỢC 75 PHÚT CỐ ĐỊNH Ở GIỮA */}
        <div className="flex items-center space-x-4">
          <div
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg border transition-all ${isUrgent
                ? 'bg-rose-600/30 border-rose-500 text-rose-300 animate-bounce'
                : isLowTime
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                  : 'bg-slate-900/90 border-slate-700 text-slate-100 shadow-inner'
              }`}
          >
            <Clock
              className={`w-4 h-4 ${isLowTime ? 'text-amber-400' : 'text-sky-400'
                }`}
            />
            <div className="flex items-baseline space-x-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 hidden sm:inline">
                Thời gian:
              </span>
              <span className="text-base md:text-lg font-black font-mono tracking-wider">
                {timeFormatted}
              </span>
            </div>
          </div>

          {/* Thống kê nhanh tiến độ */}
          <div className="hidden lg:flex items-center space-x-3 text-xs text-slate-300 border-l border-slate-700 pl-3">
            <div className="flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>
                Đã làm: <strong className="text-emerald-400 font-mono">{answeredCount}/{totalReadingQuestions}</strong> ({progressPercent}%)
              </span>
            </div>
            {flaggedQuestions.length > 0 && (
              <div className="flex items-center space-x-1 text-amber-300">
                <Flag className="w-3.5 h-3.5 text-amber-400" />
                <span>Cờ: <strong>{flaggedQuestions.length}</strong></span>
              </div>
            )}
          </div>

          {/* Tùy chọn tăng giảm cỡ chữ (Font Zoom) */}
          <div className="flex items-center space-x-1 bg-slate-900/90 border border-slate-700/80 rounded-lg p-0.5 shadow-inner">
            <button
              type="button"
              onClick={decreaseFontSize}
              disabled={fontSizeScale === 'NORMAL'}
              title="Giảm cỡ chữ (A-)"
              className="px-2 py-1 rounded text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              A-
            </button>
            <span className="text-[11px] font-mono text-sky-300 font-bold px-1.5 select-none" title="Cỡ chữ hiện tại">
              {fontSizeScale === 'NORMAL' ? '100%' : fontSizeScale === 'LARGE' ? '115%' : '130%'}
            </span>
            <button
              type="button"
              onClick={increaseFontSize}
              disabled={fontSizeScale === 'HUGE'}
              title="Tăng cỡ chữ (A+)"
              className="px-2 py-1 rounded text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              A+
            </button>
          </div>

          {/* Nút nộp bài thi */}
          <button
            type="button"
            onClick={openSubmitModal}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-lg shadow-md transition-all text-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nộp bài</span>
          </button>
        </div>
      </div>

      {/* THANH TIẾN ĐỘ (PROGRESS BAR) */}
      <div className="w-full bg-slate-800/80 h-1.5 overflow-hidden">
        <div
          className="bg-emerald-400 h-full transition-all duration-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  );
};

