import React, { useEffect, useCallback } from 'react';
import { Flag, ChevronLeft, ChevronRight, LayoutList, Square, CheckCircle2 } from 'lucide-react';
import type { Question, OptionLabel } from '../../../types/exam';
import { useReadingStore } from '../../../store/useReadingStore';
import { getReadingFontClass } from '../../../utils/fontStyles';

interface Part5ViewProps {
  questions: Question[];
}

export const Part5View: React.FC<Part5ViewProps> = ({ questions }) => {
  const {
    currentQuestionNumber,
    answers,
    flaggedQuestions,
    part5ViewMode,
    fontSizeScale,
    selectAnswer,
    toggleFlag,
    setPart5ViewMode,
    nextQuestion,
    prevQuestion,
    jumpToQuestion,
  } = useReadingStore();

  const questionNumbers = questions.map((q) => q.question_number);
  const activeQuestion = questions.find((q) => q.question_number === currentQuestionNumber) || questions[0];

  const handleSelect = useCallback(
    (qNum: number, label: OptionLabel) => {
      selectAnswer(qNum, label);
    },
    [selectAnswer]
  );

  // Phím tắt bàn phím khi ở chế độ Single
  useEffect(() => {
    if (part5ViewMode !== 'SINGLE' || !activeQuestion) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Tránh bắt phím nếu đang gõ input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        handleSelect(activeQuestion.question_number, key as OptionLabel);
      } else if (key === 'F') {
        toggleFlag(activeQuestion.question_number);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || key === 'N') {
        nextQuestion(questionNumbers);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || key === 'P') {
        prevQuestion(questionNumbers);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [part5ViewMode, activeQuestion, questionNumbers, handleSelect, toggleFlag, nextQuestion, prevQuestion]);

  if (!activeQuestion) {
    return <div className="p-8 text-center text-slate-500">Đang tải câu hỏi Part 5...</div>;
  }

  const isFlagged = flaggedQuestions.includes(activeQuestion.question_number);

  return (
    <div className="max-w-4xl mx-auto my-6 space-y-4">
      {/* Thanh công cụ chuyển đổi chế độ hiển thị & Flag */}
      <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Chế độ hiển thị:
          </span>
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setPart5ViewMode('SINGLE')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                part5ViewMode === 'SINGLE'
                  ? 'bg-white text-iig-navy shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>1 câu / màn hình</span>
            </button>
            <button
              type="button"
              onClick={() => setPart5ViewMode('LIST')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                part5ViewMode === 'LIST'
                  ? 'bg-white text-iig-navy shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Danh sách cuộn</span>
            </button>
          </div>
        </div>

        {part5ViewMode === 'SINGLE' && (
          <button
            type="button"
            onClick={() => toggleFlag(activeQuestion.question_number)}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
              isFlagged
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current' : ''}`} />
            <span>{isFlagged ? 'Đã đánh dấu (Flagged)' : 'Đánh dấu xem lại'}</span>
          </button>
        )}
      </div>

      {/* CHẾ ĐỘ 1: XEM TỪNG CÂU (SINGLE VIEW) */}
      {part5ViewMode === 'SINGLE' ? (
        <div className="bg-white border border-slate-300 rounded-2xl shadow-sm overflow-hidden">
          {/* Header câu hỏi */}
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">
              Question {activeQuestion.question_number}
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Part 5: Incomplete Sentences
            </span>
          </div>

          <div className="p-8 space-y-6">
            {/* Câu hỏi có chỗ trống */}
            <div className="p-5 bg-blue-50/40 border border-blue-100 rounded-xl">
              <p className={`font-medium text-slate-900 ${getReadingFontClass(fontSizeScale)}`}>
                <span className="font-bold text-iig-accent mr-2">
                  {activeQuestion.question_number}.
                </span>
                {activeQuestion.question_text}
              </p>
            </div>

            {/* 4 Lựa chọn A, B, C, D */}
            <div className="space-y-3 pt-2">
              {activeQuestion.options.map((opt) => {
                const isSelected = answers[activeQuestion.question_number] === opt.option_label;
                return (
                  <button
                    key={opt.option_label}
                    type="button"
                    onClick={() => handleSelect(activeQuestion.question_number, opt.option_label)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/90 shadow-sm ring-2 ring-blue-200'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-4 transition-colors flex-shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow ring-2 ring-blue-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {opt.option_label}
                      </div>
                      <span className={`leading-relaxed ${isSelected ? 'text-blue-950 font-bold' : 'text-slate-800 font-medium'} ${getReadingFontClass(fontSizeScale)}`}>
                        {opt.option_text}
                      </span>
                    </div>

                    {isSelected && (
                      <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex-shrink-0 ml-2 animate-in fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã chọn</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer chuyển câu Previous / Next */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => prevQuestion(questionNumbers)}
              disabled={questionNumbers.indexOf(activeQuestion.question_number) === 0}
              className="flex items-center space-x-1.5 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>

            <span className="text-xs text-slate-400">
              Nhấn phím <kbd className="px-1.5 py-0.5 bg-white border rounded">←</kbd> <kbd className="px-1.5 py-0.5 bg-white border rounded">→</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-white border rounded">A-D</kbd>
            </span>

            <button
              type="button"
              onClick={() => nextQuestion(questionNumbers)}
              disabled={questionNumbers.indexOf(activeQuestion.question_number) === questionNumbers.length - 1}
              className="flex items-center space-x-1.5 px-5 py-2 bg-iig-navy text-white font-semibold rounded-lg hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
            >
              <span>Câu tiếp theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* CHẾ ĐỘ 2: DANH SÁCH CUỘN (SCROLLABLE LIST) */
        <div className="space-y-4">
          {questions.map((q) => {
            const isQFlagged = flaggedQuestions.includes(q.question_number);
            const isCurrent = currentQuestionNumber === q.question_number;

            return (
              <div
                key={q.question_number}
                onClick={() => jumpToQuestion(q.question_number)}
                className={`bg-white rounded-xl border p-6 transition-all ${
                  isCurrent
                    ? 'border-iig-accent ring-2 ring-blue-100 shadow-md'
                    : 'border-slate-300 shadow-sm hover:border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <p className={`font-semibold text-slate-900 leading-relaxed ${getReadingFontClass(fontSizeScale)}`}>
                    <span className="text-iig-accent mr-2 font-mono">
                      {q.question_number}.
                    </span>
                    {q.question_text}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFlag(q.question_number);
                    }}
                    title="Đánh dấu câu này"
                    className={`p-1.5 rounded-lg border transition-colors ${
                      isQFlagged
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-amber-500'
                    }`}
                  >
                    <Flag className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                  {q.options.map((opt) => {
                    const isSelected = answers[q.question_number] === opt.option_label;
                    return (
                      <button
                        key={opt.option_label}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(q.question_number, opt.option_label);
                        }}
                        className={`flex items-center justify-between p-3.5 rounded-xl border-2 text-left transition-all text-sm cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/90 shadow-sm ring-2 ring-blue-200'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mr-3 flex-shrink-0 ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow ring-2 ring-blue-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {opt.option_label}
                          </div>
                          <span className={`leading-relaxed ${isSelected ? 'text-blue-950 font-bold' : 'text-slate-700 font-medium'} ${getReadingFontClass(fontSizeScale)}`}>
                            {opt.option_text}
                          </span>
                        </div>

                        {isSelected && (
                          <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0 ml-1.5 animate-in fade-in">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Đã chọn</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
