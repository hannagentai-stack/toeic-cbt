import React, { useEffect, useCallback } from 'react';
import { Lock, Image as ImageIcon, CheckCircle2, Clock } from 'lucide-react';
import type { Question, OptionLabel } from '../../../types/exam';
import { useListeningStore } from '../../../store/useListeningStore';

interface Part1CardProps {
  question: Question;
}

export const Part1Card: React.FC<Part1CardProps> = ({ question }) => {
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

  // Hỗ trợ phím tắt bàn phím chuẩn: Phím A, B, C, D hoặc 1, 2, 3, 4
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        handleSelect(key as OptionLabel);
      } else if (key === '1') handleSelect('A');
      else if (key === '2') handleSelect('B');
      else if (key === '3') handleSelect('C');
      else if (key === '4') handleSelect('D');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, handleSelect]);

  const labels: OptionLabel[] = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-4xl mx-auto my-6 bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden">
      {/* Tiêu đề câu hỏi */}
      <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <h2 className="text-base font-bold text-slate-800">
            Question {question.question_number}
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            (Xem ảnh và chọn phương án A, B, C hoặc D)
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

      {/* Cảnh báo đếm ngược thời gian im lặng kết thúc câu */}
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
            <span>Thời gian chọn đáp án sắp hết:</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-black tracking-wider">
              00:{String(silenceRemaining).padStart(2, '0')}s
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              (Hệ thống sẽ tự động khóa và chuyển sang câu tiếp theo)
            </span>
          </div>
        </div>
      )}

      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Khung hiển thị ảnh lớn chất lượng cao */}
        <div className="md:col-span-7 flex flex-col items-center justify-center">
          <div className="relative w-full aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden border border-slate-300 shadow-inner flex items-center justify-center group">
            {question.image_url ? (
              <img
                src={question.image_url}
                alt={`TOEIC Part 1 - Question ${question.question_number}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                loading="eager"
              />
            ) : (
              <div className="text-center text-slate-400 p-8">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Hình ảnh đang được tải...</p>
              </div>
            )}
          </div>
        </div>

        {/* Khung lựa chọn đáp án: Đúng quy chuẩn Part 1 KHÔNG hiển thị chữ, chỉ hiện radio buttons (A)(B)(C)(D) */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase font-bold tracking-wider text-slate-500">
              Chọn một đáp án đúng nhất:
            </p>
            {selectedOption && (
              <span className="text-[11px] font-bold text-emerald-600">
                ✓ Đã lưu lựa chọn ({selectedOption})
              </span>
            )}
          </div>

          <div className="space-y-3">
            {labels.map((label) => {
              const isSelected = selectedOption === label;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleSelect(label)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-iig-accent bg-blue-50/90 shadow-sm ring-2 ring-blue-200'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  } ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer active:scale-[0.99]'}`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm mr-3.5 transition-colors ${
                        isSelected
                          ? 'bg-iig-accent text-white shadow-sm ring-2 ring-blue-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {label}
                    </div>
                    <span className={`text-sm md:text-base ${isSelected ? 'font-bold text-blue-900' : 'font-semibold text-slate-700'}`}>
                      Statement ({label})
                    </span>
                  </div>

                  {isSelected && (
                    <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã chọn</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 text-center text-xs text-slate-400">
            Mẹo: Bạn có thể nhấn phím <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono">A</kbd> <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono">B</kbd> <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono">C</kbd> <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono">D</kbd> trên bàn phím.
          </div>
        </div>
      </div>
    </div>
  );
};
