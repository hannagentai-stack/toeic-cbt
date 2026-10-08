import React from 'react';
import { Lock, FileText, BarChart3, CheckCircle2, Clock } from 'lucide-react';
import type { Passage, Question, OptionLabel } from '../../../types/exam';
import { useListeningStore } from '../../../store/useListeningStore';

interface Part3And4GroupProps {
  passage?: Passage;
  questions: Question[];
}

export const Part3And4Group: React.FC<Part3And4GroupProps> = ({ passage, questions }) => {
  const { answers, selectAnswer, lockedQuestions, phase, silenceRemaining } = useListeningStore();

  const labels: OptionLabel[] = ['A', 'B', 'C', 'D'];

  const questionRangeText =
    questions.length > 0
      ? `Questions ${questions[0].question_number} - ${questions[questions.length - 1].question_number}`
      : 'Conversation / Talk';

  return (
    <div className="max-w-6xl mx-auto my-6 bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden">
      {/* Tiêu đề nhóm câu hỏi chuẩn ETS */}
      <div className="bg-slate-100 px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-iig-accent" />
          <h2 className="text-base font-bold text-slate-800">
            {passage?.title || `${questionRangeText} refer to the following audio`}
          </h2>
        </div>
        <span className="text-xs bg-slate-200/80 text-slate-700 px-2.5 py-1 rounded font-medium">
          {questions.length} câu hỏi hiển thị đồng thời
        </span>
      </div>

      {/* Cảnh báo đếm ngược thời gian im lặng sau đoạn audio */}
      {phase === 'SILENCE_COUNTDOWN' && (
        <div
          className={`px-6 py-2.5 border-b flex items-center justify-between transition-colors animate-pulse ${
            silenceRemaining <= 4
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          <div className="flex items-center space-x-2 text-xs font-bold">
            <Clock className={`w-4 h-4 ${silenceRemaining <= 4 ? 'text-rose-600' : 'text-amber-600'}`} />
            <span>Thời gian trả lời cho cụm câu hỏi:</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-black tracking-wider">
              00:{String(silenceRemaining).padStart(2, '0')}s
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              (Hệ thống sẽ tự động chuyển sang đoạn tiếp theo khi hết thời gian chờ)
            </span>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className={`grid grid-cols-1 ${passage?.image_url ? 'lg:grid-cols-12 gap-8' : 'gap-6'}`}>
          {/* Cột hiển thị hình ảnh bảng biểu / biểu đồ nếu có (Sticky trên desktop để không bị che khuất khi cuộn) */}
          {passage?.image_url && (
            <div className="lg:col-span-5 flex flex-col lg:sticky lg:top-4 lg:self-start">
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 shadow-inner">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  <BarChart3 className="w-4 h-4 text-iig-accent" />
                  <span>Graphic / Visual Reference</span>
                </div>
                <div className="rounded overflow-hidden border border-slate-200 bg-white">
                  <img
                    src={passage.image_url}
                    alt={passage.title || 'Graphic reference'}
                    className="w-full h-auto object-contain max-h-[380px]"
                    loading="eager"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  * Đối chiếu dữ liệu hình ảnh với nội dung câu hỏi bên phải
                </p>
              </div>
            </div>
          )}

          {/* Cột hiển thị 3 câu hỏi và đáp án cùng một lúc */}
          <div className={`${passage?.image_url ? 'lg:col-span-7' : 'w-full'} space-y-6`}>
            {questions.map((q) => {
              const isLocked = lockedQuestions.includes(q.question_number);
              const selectedOption = answers[q.question_number];

              return (
                <div
                  key={q.question_number}
                  className={`p-5 rounded-xl border transition-all ${
                    isLocked
                      ? 'bg-slate-50 border-slate-200 opacity-70'
                      : selectedOption
                      ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-100'
                      : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                  }`}
                >
                  {/* Tiêu đề & nội dung câu hỏi */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-sm md:text-base font-bold text-slate-900 leading-snug">
                      <span className="text-iig-accent mr-2 font-mono">
                        {q.question_number}.
                      </span>
                      {q.question_text}
                    </p>
                    {isLocked ? (
                      <span className="flex-shrink-0 flex items-center space-x-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <Lock className="w-3 h-3" />
                        <span>Đã khóa</span>
                      </span>
                    ) : selectedOption ? (
                      <span className="flex-shrink-0 flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-in fade-in">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Đã chọn ({selectedOption})</span>
                      </span>
                    ) : null}
                  </div>

                  {/* 4 Lựa chọn A, B, C, D */}
                  <div className="space-y-2 pt-1">
                    {q.options && q.options.length > 0
                      ? q.options.map((opt) => {
                          const isSelected = selectedOption === opt.option_label;
                          return (
                            <button
                              key={opt.option_label}
                              type="button"
                              disabled={isLocked}
                              onClick={() => {
                                if (!isLocked) {
                                  selectAnswer(q.question_number, opt.option_label);
                                }
                              }}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all text-xs md:text-sm ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50/90 shadow-sm ring-2 ring-blue-200'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                              } ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer active:scale-[0.99]'}`}
                            >
                              <div className="flex items-center">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mr-3 transition-colors flex-shrink-0 ${
                                    isSelected
                                      ? 'bg-blue-600 text-white shadow ring-2 ring-blue-300'
                                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                                  }`}
                                >
                                  {opt.option_label}
                                </div>
                                <span
                                  className={`font-medium leading-relaxed ${
                                    isSelected ? 'text-blue-950 font-bold' : 'text-slate-700'
                                  }`}
                                >
                                  {opt.option_text}
                                </span>
                              </div>

                              {isSelected && (
                                <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex-shrink-0 ml-2 animate-in fade-in">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Đã chọn</span>
                                </span>
                              )}
                            </button>
                          );
                        })
                      : labels.map((label) => (
                          <div key={label} className="text-xs text-slate-400">
                            (Đang tải lựa chọn...)
                          </div>
                        ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
