import React, { useRef } from 'react';
import { Flag, FileText, CheckCircle2 } from 'lucide-react';
import type { Passage, Question, OptionLabel } from '../../../types/exam';
import { useReadingStore } from '../../../store/useReadingStore';
import { getReadingFontClass } from '../../../utils/fontStyles';

interface Part6ViewProps {
  passage: Passage;
  questions: Question[];
}

export const Part6View: React.FC<Part6ViewProps> = ({ passage, questions }) => {
  const {
    answers,
    flaggedQuestions,
    currentQuestionNumber,
    fontSizeScale,
    selectAnswer,
    toggleFlag,
    jumpToQuestion,
  } = useReadingStore();

  const questionCardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Bấm vào chỗ trống trong đoạn văn bên trái -> cuộn sang câu hỏi tương ứng bên phải
  const handleBlankClick = (qNum: number) => {
    jumpToQuestion(qNum);
    const element = questionCardRefs.current[qNum];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  /**
   * Phân tích nội dung đoạn văn bản để tìm các chỗ trống [131], [132]...
   * và render thành các badge bấm được
   */
  const renderInteractivePassage = (content: string) => {
    // Regex tìm các mẫu như [131], [11], (131)
    const parts = content.split(/(\[\d+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const qNum = parseInt(match[1], 10);
        const isAnswered = answers[qNum] !== undefined;
        const isCurrent = currentQuestionNumber === qNum;
        const selectedLabel = answers[qNum];

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleBlankClick(qNum)}
            className={`inline-flex items-center mx-1.5 px-3 py-1 rounded-lg border-2 text-xs md:text-sm font-bold font-mono transition-all transform hover:scale-105 ${
              isCurrent
                ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300'
                : isAnswered
                ? 'bg-emerald-100 text-emerald-800 border-emerald-400 hover:bg-emerald-200'
                : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
            }`}
          >
            <span>[{qNum}]</span>
            <span className="mx-1">-----</span>
            {isAnswered && (
              <span className="ml-1 px-1.5 py-0.2 bg-emerald-600 text-white rounded text-[11px] font-black">
                {selectedLabel}
              </span>
            )}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="h-full p-2.5 md:p-3.5 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 md:gap-4 h-full">
        {/* CỘT TRÁI: ĐOẠN VĂN BẢN PART 6 (Cuộn độc lập) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-300 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-iig-accent" />
              <h3 className="font-bold text-sm text-slate-800">
                {passage.title || 'Part 6: Text Completion'}
              </h3>
            </div>
            <span className="text-[11px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded">
              Bấm vào ô số để chọn câu
            </span>
          </div>

          <div className={`flex-1 overflow-y-auto p-4 md:p-6 text-slate-800 font-serif whitespace-pre-line selection:bg-yellow-200 ${getReadingFontClass(fontSizeScale)}`}>
            {passage.content ? (
              renderInteractivePassage(passage.content)
            ) : (
              <p className="text-slate-400">Đang tải đoạn văn...</p>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: CÁC CÂU HỎI VÀ ĐÁP ÁN (Cuộn độc lập) */}
        <div className="lg:col-span-6 flex flex-col h-full overflow-y-auto space-y-3.5 pr-1">
          {questions.map((q) => {
            const isSelected = answers[q.question_number];
            const isFlagged = flaggedQuestions.includes(q.question_number);
            const isCurrent = currentQuestionNumber === q.question_number;

            return (
              <div
                key={q.question_number}
                ref={(el) => {
                  questionCardRefs.current[q.question_number] = el;
                }}
                onClick={() => jumpToQuestion(q.question_number)}
                className={`bg-white rounded-xl border p-5 transition-all ${
                  isCurrent
                    ? 'border-iig-accent ring-2 ring-blue-100 shadow-md'
                    : 'border-slate-300 shadow-sm hover:border-slate-400'
                }`}
              >
                {/* Header câu hỏi */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-lg bg-iig-navy text-white text-xs font-bold font-mono flex items-center justify-center">
                      {q.question_number}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Chỗ trống [{q.question_number}]
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFlag(q.question_number);
                    }}
                    title="Đánh dấu câu này"
                    className={`p-1.5 rounded-lg border transition-colors ${
                      isFlagged
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-amber-500'
                    }`}
                  >
                    <Flag className="w-4 h-4 fill-current" />
                  </button>
                </div>

                {/* 4 Lựa chọn A, B, C, D */}
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const isOptChosen = isSelected === opt.option_label;
                    return (
                      <button
                        key={opt.option_label}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAnswer(q.question_number, opt.option_label as OptionLabel);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all text-xs md:text-sm cursor-pointer ${
                          isOptChosen
                            ? 'border-blue-600 bg-blue-50/90 font-semibold text-blue-950 shadow-sm ring-2 ring-blue-200'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mr-3 flex-shrink-0 ${
                              isOptChosen
                                ? 'bg-blue-600 text-white shadow ring-2 ring-blue-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {opt.option_label}
                          </div>
                          <span className={`font-medium ${getReadingFontClass(fontSizeScale)}`}>{opt.option_text}</span>
                        </div>

                        {isOptChosen && (
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
      </div>
    </div>
  );
};
