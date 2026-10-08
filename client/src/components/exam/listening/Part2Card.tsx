import React, { useEffect, useCallback } from 'react';
import { Lock, Volume2, CheckCircle2, Clock } from 'lucide-react';
import type { Question, OptionLabel } from '../../../types/exam';
import { useListeningStore } from '../../../store/useListeningStore';

interface Part2CardProps {
  question: Question;
  isPlaying: boolean;
}

export const Part2Card: React.FC<Part2CardProps> = ({ question, isPlaying }) => {
  const { answers, selectAnswer, lockedQuestions, phase, silenceRemaining } = useListeningStore();

  const isLocked = lockedQuestions.includes(question.question_number);
  const selectedOption = answers[question.question_number];

  const handleSelect = useCallback(
    (label: OptionLabel) => {
      if (!isLocked) {
        selectAnswer(question.question_number, label);
      }
    },
    [isLocked, question.question_number, selectAnswer]
  );

  // Phím tắt bàn phím chuẩn A, B, C hoặc 1, 2, 3
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C'].includes(key)) {
        handleSelect(key as OptionLabel);
      } else if (key === '1') handleSelect('A');
      else if (key === '2') handleSelect('B');
      else if (key === '3') handleSelect('C');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, handleSelect]);

  const labels: OptionLabel[] = ['A', 'B', 'C'];

  return (
    <div className="max-w-3xl mx-auto my-8 bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden">
      {/* Tiêu đề câu hỏi Part 2 */}
      <div className="bg-slate-100 px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <h2 className="text-base font-bold text-slate-800">
            Question {question.question_number}
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            (Part 2: Question - Response)
          </span>
        </div>

        {isLocked ? (
          <span className="flex items-center space-x-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
            <Lock className="w-3.5 h-3.5" />
            <span>Đã khóa câu hỏi</span>
          </span>
        ) : selectedOption ? (
          <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đã chọn ({selectedOption}) — Đã ghi nhận</span>
          </span>
        ) : null}
      </div>

      {/* Cảnh báo đếm ngược thời gian im lặng sau audio */}
      {phase === 'SILENCE_COUNTDOWN' && !isLocked && (
        <div
          className={`px-6 py-2 border-b flex items-center justify-between transition-colors animate-pulse ${
            silenceRemaining <= 3
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          <div className="flex items-center space-x-2 text-xs font-bold">
            <Clock className={`w-4 h-4 ${silenceRemaining <= 3 ? 'text-rose-600' : 'text-amber-600'}`} />
            <span>Thời gian chọn đáp án:</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-black tracking-wider">
              00:{String(silenceRemaining).padStart(2, '0')}s
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              (Hệ thống sẽ chuyển câu tiếp theo khi hết giờ)
            </span>
          </div>
        </div>
      )}

      <div className="p-8 md:p-12 space-y-8 text-center">
        {/* Khung mô phỏng audio câu hỏi đang được đọc */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-xl max-w-md mx-auto">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all ${
              isPlaying
                ? 'bg-iig-accent text-white shadow-lg ring-8 ring-blue-100 animate-pulse'
                : 'bg-slate-200 text-slate-500'
            }`}
          >
            <Volume2 className="w-8 h-8" />
          </div>
          <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            {isPlaying ? 'Đang đọc câu hỏi & phản hồi...' : 'Mark your answer on your answer sheet'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            (Không hiển thị văn bản câu hỏi theo chuẩn đề thi thật)
          </p>
        </div>

        {/* Khung lựa chọn đáp án: Chỉ có đúng 3 lựa chọn (A), (B), (C) KHÔNG CÓ (D) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-xl mx-auto">
          {labels.map((label) => {
            const isSelected = selectedOption === label;
            return (
              <button
                key={label}
                type="button"
                disabled={isLocked}
                onClick={() => handleSelect(label)}
                className={`py-6 px-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'border-iig-accent bg-blue-50/90 shadow-md ring-2 ring-blue-300 scale-[1.02]'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                } ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer active:scale-95'}`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 transition-colors ${
                    isSelected
                      ? 'bg-iig-accent text-white shadow'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  {label}
                </div>
                <span className={`text-xs uppercase font-bold tracking-wider ${isSelected ? 'text-blue-900' : 'text-slate-500'}`}>
                  Option ({label})
                </span>

                {isSelected && (
                  <span className="mt-2 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Đã chọn</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Thanh phản hồi xác nhận trạng thái lưu */}
        {selectedOption ? (
          <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Bạn đã chọn phương án ({selectedOption}) — Đáp án đã được hệ thống lưu an toàn.</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400">
            Nhấn phím <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono">A</kbd> <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono">B</kbd> <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono">C</kbd> để chọn nhanh.
          </div>
        )}
      </div>
    </div>
  );
};
