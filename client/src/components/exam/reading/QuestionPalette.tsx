import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import type { Question } from '../../../types/exam';
import { useReadingStore } from '../../../store/useReadingStore';

interface QuestionPaletteProps {
  questions: Question[];
  onSelectQuestion: (questionNumber: number) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  onSelectQuestion,
}) => {
  const { answers, flaggedQuestions, currentQuestionNumber } = useReadingStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PART_5' | 'PART_6' | 'PART_7' | 'FLAGGED' | 'UNANSWERED'>('ALL');

  useEffect(() => {
    if (currentQuestionNumber) {
      const el = document.getElementById(`reading-palette-${currentQuestionNumber}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentQuestionNumber]);

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'PART_5') return q.part_number === 5;
    if (filter === 'PART_6') return q.part_number === 6;
    if (filter === 'PART_7') return q.part_number === 7;
    if (filter === 'FLAGGED') return flaggedQuestions.includes(q.question_number);
    if (filter === 'UNANSWERED') return answers[q.question_number] === undefined;
    return true;
  });

  const total = questions.length;
  const answered = questions.filter((q) => answers[q.question_number] !== undefined).length;
  const flagged = questions.filter((q) => flaggedQuestions.includes(q.question_number)).length;

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-white border-l border-slate-300 transition-all duration-200 flex flex-col items-center py-3 z-30 shadow-md flex-shrink-0 select-none font-sans">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          title="Mở rộng bảng câu hỏi (Expand Palette)"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors mb-3"
        >
          <ChevronLeft className="w-5 h-5 text-iig-navy" />
        </button>

        <div className="flex-1 flex flex-col items-center space-y-3">
          {/* Tỉ lệ câu hỏi đã làm */}
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 rounded px-1 py-1 text-[10px] font-mono font-bold text-center leading-tight shadow-2xs">
            <div>{answered}</div>
            <div className="text-slate-400 text-[8px]">/</div>
            <div>{total}</div>
          </div>

          {/* Nhãn dọc */}
          <div className="py-2 flex-1 flex items-center justify-center">
            <span
              className="text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              BẢNG CÂU HỎI
            </span>
          </div>

          {/* Badge cờ flag nếu có */}
          {flagged > 0 && (
            <span
              className="w-6 h-6 rounded-full bg-amber-100 border border-amber-400 text-amber-800 text-[9px] font-bold flex items-center justify-center shadow-2xs"
              title={`${flagged} câu đã gắn cờ`}
            >
              🚩{flagged}
            </span>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 xl:w-72 bg-white border-l border-slate-300 transition-all duration-200 flex flex-col z-30 shadow-md flex-shrink-0 select-none font-sans">
      {/* Header thanh điều hướng */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex-1 mr-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Bảng câu hỏi
            </h3>
            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
              {answered}/{total}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${total > 0 ? (answered / total) * 100 : 0}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          title="Thu gọn bảng câu hỏi để đọc rộng hơn"
          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Bộ lọc nhanh câu hỏi */}
      <div className="p-2 border-b border-slate-200 bg-white">
        <div className="flex items-center space-x-1 overflow-x-auto py-0.5 text-[10px] font-semibold text-slate-600 no-scrollbar">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-2 py-0.5 rounded whitespace-nowrap transition-colors ${
              filter === 'ALL' ? 'bg-iig-navy text-white' : 'hover:bg-slate-100'
            }`}
          >
            Tất cả ({total})
          </button>
          <button
            type="button"
            onClick={() => setFilter('PART_5')}
            className={`px-1.5 py-0.5 rounded whitespace-nowrap transition-colors ${
              filter === 'PART_5' ? 'bg-iig-navy text-white' : 'hover:bg-slate-100'
            }`}
          >
            P5
          </button>
          <button
            type="button"
            onClick={() => setFilter('PART_6')}
            className={`px-1.5 py-0.5 rounded whitespace-nowrap transition-colors ${
              filter === 'PART_6' ? 'bg-iig-navy text-white' : 'hover:bg-slate-100'
            }`}
          >
            P6
          </button>
          <button
            type="button"
            onClick={() => setFilter('PART_7')}
            className={`px-1.5 py-0.5 rounded whitespace-nowrap transition-colors ${
              filter === 'PART_7' ? 'bg-iig-navy text-white' : 'hover:bg-slate-100'
            }`}
          >
            P7
          </button>
          <button
            type="button"
            onClick={() => setFilter('FLAGGED')}
            className={`px-1.5 py-0.5 rounded whitespace-nowrap transition-colors ${
              filter === 'FLAGGED' ? 'bg-amber-500 text-white' : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            🚩 {flagged}
          </button>
          <button
            type="button"
            onClick={() => setFilter('UNANSWERED')}
            className={`px-1.5 py-0.5 rounded whitespace-nowrap transition-colors ${
              filter === 'UNANSWERED' ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Chưa {total - answered}
          </button>
        </div>
      </div>

      {/* Lưới các nút câu hỏi 1-100 */}
      <div className="flex-1 overflow-y-auto p-2.5">
        <div className="grid grid-cols-5 gap-1.5">
          {filteredQuestions.map((q) => {
            const isAnswered = answers[q.question_number] !== undefined;
            const isFlagged = flaggedQuestions.includes(q.question_number);
            const isCurrent = currentQuestionNumber === q.question_number;
            const chosenOption = answers[q.question_number];

            return (
              <button
                key={q.question_number}
                id={`reading-palette-${q.question_number}`}
                type="button"
                onClick={() => onSelectQuestion(q.question_number)}
                className={`relative h-9 rounded text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                  isCurrent
                    ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50 text-blue-900 shadow-sm z-10'
                    : 'hover:border-slate-400'
                } ${
                  isAnswered && !isCurrent
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                    : !isCurrent
                    ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    : ''
                }`}
              >
                {/* Cờ Flag ở góc trên phải */}
                {isFlagged && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-amber-500 shadow-2xs" />
                )}

                <span className="font-mono text-[11px] leading-tight">{q.question_number}</span>
                {isAnswered && (
                  <span className="text-[9px] font-black text-emerald-700 leading-none">
                    {chosenOption}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chú thích màu sắc (Legend) */}
      <div className="p-2.5 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-600 grid grid-cols-2 gap-1.5">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400 flex-shrink-0" />
          <span>Đã làm ({answered})</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded bg-white border border-slate-300 flex-shrink-0" />
          <span>Chưa làm ({total - answered})</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-400 relative flex-shrink-0">
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
          </span>
          <span>Gắn cờ ({flagged})</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded border-2 border-blue-600 bg-blue-50 flex-shrink-0" />
          <span>Đang chọn</span>
        </div>
      </div>
    </aside>
  );
};

