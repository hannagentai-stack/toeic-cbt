import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface CbtRightPaletteProps {
  questions: Array<{ question_number: number }>;
  currentQuestionNumber: number;
  answers: Record<number, string>;
  flaggedQuestions: number[];
  onSelectQuestion: (questionNumber: number) => void;
}

export const CbtRightPalette: React.FC<CbtRightPaletteProps> = ({
  questions,
  currentQuestionNumber,
  answers,
  flaggedQuestions,
  onSelectQuestion,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (currentQuestionNumber) {
      const el = document.getElementById(`cbt-palette-${currentQuestionNumber}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentQuestionNumber]);

  const total = questions.length;
  const answered = questions.filter((q) => answers[q.question_number] !== undefined).length;
  const flagged = flaggedQuestions.length;

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
    <aside className="w-60 xl:w-72 bg-white border-l border-slate-300 flex flex-col flex-shrink-0 select-none font-sans transition-all duration-200">
      {/* Header Palette */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex-1 mr-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
              Bảng câu hỏi
            </span>
            <span className="text-[11px] font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
              {answered} / {total}
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

      {/* Lưới các ô câu hỏi */}
      <div className="flex-1 overflow-y-auto p-2.5">
        <div className="grid grid-cols-5 gap-1.5 text-xs font-mono">
          {questions.map((q) => {
            const isAnswered = answers[q.question_number] !== undefined;
            const isFlagged = flaggedQuestions.includes(q.question_number);
            const isCurrent = currentQuestionNumber === q.question_number;
            const chosen = answers[q.question_number];

            let style = 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50';
            if (isCurrent) {
              style = 'border-2 border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-sm';
            } else if (isAnswered) {
              style = 'border-emerald-400 bg-emerald-100 text-emerald-900 font-bold';
            }

            return (
              <button
                key={q.question_number}
                id={`cbt-palette-${q.question_number}`}
                type="button"
                onClick={() => onSelectQuestion(q.question_number)}
                className={`h-9 rounded border transition-all flex flex-col items-center justify-center relative ${style}`}
              >
                {/* Dấu chấm cờ Flag */}
                {isFlagged && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-amber-500 shadow-sm" />
                )}
                <span>{q.question_number}</span>
                {isAnswered && !isCurrent && (
                  <span className="text-[9px] font-black leading-none text-emerald-800">
                    {chosen}
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
          <span className="w-3.5 h-3.5 rounded border border-emerald-400 bg-emerald-100 flex-shrink-0" />
          <span>Đã làm ({answered})</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded border border-slate-300 bg-white flex-shrink-0" />
          <span>Chưa làm ({total - answered})</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded border border-slate-300 bg-white relative flex-shrink-0">
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
          </span>
          <span>Gắn cờ ({flagged})</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded border-2 border-blue-600 bg-blue-50 flex-shrink-0" />
          <span>Đang chọn</span>
        </div>
      </div>
    </aside>
  );
};

