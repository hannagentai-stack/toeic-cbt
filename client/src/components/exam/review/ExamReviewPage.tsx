import React, { useState, useRef, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Volume2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Bookmark,
  FileText,
} from 'lucide-react';
import type { ExamData, OptionLabel, Question, Option, Passage } from '../../../types/exam';
import { mediaService } from '../../../services/mediaService';

interface ExamReviewPageProps {
  examData: ExamData;
  answers: Record<number, OptionLabel>;
  onBackToResult: () => void;
}

export const ExamReviewPage: React.FC<ExamReviewPageProps> = ({
  examData,
  answers,
  onBackToResult,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [filter, setFilter] = useState<'ALL' | 'INCORRECT' | 'CORRECT' | 'UNANSWERED'>('ALL');
  const [savedToMistakeBank, setSavedToMistakeBank] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const allQuestions = useMemo(() => {
    return [...examData.questions].sort((a, b) => a.question_number - b.question_number);
  }, [examData.questions]);

  // Lọc câu hỏi theo trạng thái
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q: Question) => {
      const chosen = answers[q.question_number];
      const isCorrect = chosen === q.correct_option;
      const isUnanswered = chosen === undefined;

      if (filter === 'INCORRECT') return !isUnanswered && !isCorrect;
      if (filter === 'CORRECT') return isCorrect;
      if (filter === 'UNANSWERED') return isUnanswered;
      return true;
    });
  }, [allQuestions, answers, filter]);

  const activeQuestion = filteredQuestions[currentQuestionIndex] || allQuestions[0];

  // Tìm passage liên quan nếu có
  const activePassage = useMemo(() => {
    if (!activeQuestion) return undefined;
    return examData.passages.find((p: Passage) => p.id_ref === activeQuestion.passage_id_ref);
  }, [examData.passages, activeQuestion]);

  // Hàm phát lại audio câu hỏi
  const handlePlayAudio = (url: string | null | undefined) => {
    if (!url) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    setIsPlayingAudio(true);

    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => setIsPlayingAudio(false);
    audio.play().catch(() => setIsPlayingAudio(false));
  };

  // Toggle lưu vào sổ câu sai
  const toggleSaveMistake = (qNum: number) => {
    setSavedToMistakeBank((prev) =>
      prev.includes(qNum) ? prev.filter((id) => id !== qNum) : [...prev, qNum]
    );
  };

  if (!activeQuestion) {
    return (
      <div className="p-12 text-center text-slate-500">
        Không có câu hỏi nào khớp với bộ lọc.
      </div>
    );
  }

  const chosenOption = answers[activeQuestion.question_number];
  const isAnswered = chosenOption !== undefined;
  const isCorrect = isAnswered && chosenOption === activeQuestion.correct_option;

  // Lấy audio URL của câu hỏi hoặc của Passage (ưu tiên từ memory cache)
  const rawAudioToPlay = activeQuestion.audio_url || activePassage?.audio_url;
  const audioUrlToPlay = rawAudioToPlay ? mediaService.getPlayableAudioUrl(rawAudioToPlay) : undefined;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* 1. Header trang Review */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 sticky top-0 z-30 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBackToResult}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay về bảng điểm</span>
          </button>
          <div className="border-l border-slate-300 pl-3">
            <h1 className="text-sm font-bold text-slate-800">
              Xem lại chi tiết bài làm: {examData.test.title}
            </h1>
            <p className="text-xs text-slate-500">
              Đáp án, transcript và giải thích ngữ pháp chi tiết từng câu
            </p>
          </div>
        </div>

        {/* Thanh lọc trạng thái */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setFilter('ALL');
              setCurrentQuestionIndex(0);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({allQuestions.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter('INCORRECT');
              setCurrentQuestionIndex(0);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'INCORRECT'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Câu sai ({allQuestions.filter((q: Question) => answers[q.question_number] && answers[q.question_number] !== q.correct_option).length})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter('CORRECT');
              setCurrentQuestionIndex(0);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'CORRECT'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Câu đúng ({allQuestions.filter((q: Question) => answers[q.question_number] === q.correct_option).length})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter('UNANSWERED');
              setCurrentQuestionIndex(0);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'UNANSWERED'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Chưa làm ({allQuestions.filter((q: Question) => answers[q.question_number] === undefined).length})
          </button>
        </div>
      </header>

      {/* 2. Vùng xem lại câu hỏi */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI (3 cols): BẢNG DANH SÁCH CÂU HỎI */}
        <aside className="lg:col-span-4 bg-white rounded-2xl border border-slate-300 shadow-sm p-4 h-[calc(100vh-140px)] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Danh sách câu ({filteredQuestions.length})
            </span>
            <div className="flex items-center space-x-2 text-[10px]">
              <span className="flex items-center space-x-1 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Đúng</span>
              </span>
              <span className="flex items-center space-x-1 text-rose-700">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Sai</span>
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-4 sm:grid-cols-5 gap-2 pr-1">
            {filteredQuestions.map((q, idx) => {
              const qChosen = answers[q.question_number];
              const qIsCorrect = qChosen === q.correct_option;
              const qIsUnanswered = qChosen === undefined;
              const isCurrent = idx === currentQuestionIndex;

              let btnStyle = 'bg-slate-50 text-slate-500 border-slate-200';
              if (!qIsUnanswered && qIsCorrect) {
                btnStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
              } else if (!qIsUnanswered && !qIsCorrect) {
                btnStyle = 'bg-rose-50 text-rose-800 border-rose-300 font-bold';
              }

              return (
                <button
                  key={q.question_number}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`h-11 rounded-xl text-xs font-mono transition-all flex flex-col items-center justify-center border ${btnStyle} ${
                    isCurrent
                      ? 'ring-2 ring-blue-600 border-blue-600 shadow-md scale-105 z-10'
                      : 'hover:border-slate-400'
                  }`}
                >
                  <span>{q.question_number}</span>
                  <span className="text-[10px] leading-none font-bold">
                    {qChosen || '-'}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* CỘT PHẢI (8 cols): CHI TIẾT CÂU HỎI & GIẢI THÍCH */}
        <main className="lg:col-span-8 bg-white rounded-2xl border border-slate-300 shadow-sm p-6 md:p-8 overflow-y-auto h-[calc(100vh-140px)] space-y-6">
          {/* Header thẻ câu hỏi */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center space-x-3">
              <span className="w-10 h-10 rounded-xl bg-iig-navy text-white text-base font-bold font-mono flex items-center justify-center shadow">
                {activeQuestion.question_number}
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Part {activeQuestion.part_number} • {activeQuestion.question_type}
                </span>
                <div className="flex items-center space-x-2 mt-0.5">
                  {isCorrect ? (
                    <span className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>LÀM ĐÚNG</span>
                    </span>
                  ) : !isAnswered ? (
                    <span className="flex items-center space-x-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs font-bold border border-slate-200">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>CHƯA LÀM</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-xs font-bold border border-rose-200">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>LÀM SAI</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Nút nghe lại Audio & Lưu vào sổ câu sai */}
            <div className="flex items-center space-x-2">
              {audioUrlToPlay && (
                <button
                  type="button"
                  onClick={() => handlePlayAudio(audioUrlToPlay)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                    isPlayingAudio
                      ? 'bg-blue-600 text-white border-blue-700 animate-pulse'
                      : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isPlayingAudio ? 'Đang phát...' : 'Nghe lại audio'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => toggleSaveMistake(activeQuestion.question_number)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  savedToMistakeBank.includes(activeQuestion.question_number)
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>
                  {savedToMistakeBank.includes(activeQuestion.question_number)
                    ? 'Đã lưu sổ sai'
                    : 'Lưu vào sổ câu sai'}
                </span>
              </button>
            </div>
          </div>

          {/* Ảnh minh họa nếu có (Part 1 hoặc Passage graphic) */}
          {(activeQuestion.image_url || activePassage?.image_url) && (
            <div className="max-w-md mx-auto rounded-xl overflow-hidden border border-slate-300 bg-slate-50 shadow-inner p-2">
              <img
                src={activeQuestion.image_url || activePassage?.image_url || ''}
                alt="Question visual"
                className="w-full h-auto object-contain rounded"
              />
            </div>
          )}

          {/* Đoạn văn đọc (Part 6 hoặc Part 7) */}
          {activePassage?.content && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-iig-accent" />
                <span>Nội dung bài đọc liên quan:</span>
              </span>
              <p className="text-sm font-serif text-slate-800 leading-relaxed whitespace-pre-line border-t border-slate-200 pt-3">
                {activePassage.content}
              </p>
            </div>
          )}

          {/* Câu hỏi */}
          {activeQuestion.question_text && (
            <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-xl">
              <p className="font-semibold text-slate-900 text-base leading-relaxed">
                <span className="text-iig-accent mr-2 font-mono">
                  {activeQuestion.question_number}.
                </span>
                {activeQuestion.question_text}
              </p>
            </div>
          )}

          {/* Danh sách 4 Lựa chọn A, B, C, D kèm so sánh đáp án */}
          <div className="space-y-2.5">
            {activeQuestion.options.map((opt: Option) => {
              const isCorrectOpt = opt.option_label === activeQuestion.correct_option;
              const isUserChosen = chosenOption === opt.option_label;

              let style = 'border-slate-200 bg-white text-slate-700';
              if (isCorrectOpt) {
                style = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-semibold ring-1 ring-emerald-300';
              } else if (isUserChosen && !isCorrectOpt) {
                style = 'border-rose-400 bg-rose-50 text-rose-950 font-semibold ring-1 ring-rose-200';
              }

              return (
                <div
                  key={opt.option_label}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-sm ${style}`}
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        isCorrectOpt
                          ? 'bg-emerald-600 text-white'
                          : isUserChosen
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-700 border'
                      }`}
                    >
                      {opt.option_label}
                    </span>
                    <span>{opt.option_text}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs font-bold">
                    {isCorrectOpt && (
                      <span className="text-emerald-700 flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đáp án đúng</span>
                      </span>
                    )}
                    {isUserChosen && !isCorrectOpt && (
                      <span className="text-rose-600 flex items-center space-x-1">
                        <XCircle className="w-4 h-4" />
                        <span>Bạn đã chọn</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* LỜI THOẠI (TRANSCRIPT) CHO LISTENING */}
          {activeQuestion.transcript && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 space-y-2">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Volume2 className="w-4 h-4 text-amber-600" />
                <span>Transcript (Lời thoại audio):</span>
              </span>
              <p className="text-sm text-slate-800 leading-relaxed font-mono whitespace-pre-line border-t border-amber-200 pt-2">
                {activeQuestion.transcript}
              </p>
            </div>
          )}

          {/* DỊCH NGHĨA TIẾNG VIỆT */}
          {activeQuestion.vietnamese_translation && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Dịch nghĩa tiếng Việt:
              </span>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line border-t border-slate-200 pt-2">
                {activeQuestion.vietnamese_translation}
              </p>
            </div>
          )}

          {/* GIẢI THÍCH CHI TIẾT NGỮ PHÁP & TỪ VỰNG */}
          {activeQuestion.explanation && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 space-y-2">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Giải thích chi tiết & Mẹo làm bài:</span>
              </span>
              <p className="text-sm text-slate-800 leading-relaxed border-t border-blue-200 pt-2">
                {activeQuestion.explanation}
              </p>
            </div>
          )}

          {/* Tags ngữ pháp / từ vựng */}
          {activeQuestion.tags && activeQuestion.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-xs text-slate-400 font-medium">Chủ đề:</span>
              {activeQuestion.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Điều hướng Câu trước / Câu tiếp */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>

            <span className="text-xs text-slate-400 font-mono">
              Câu {currentQuestionIndex + 1} / {filteredQuestions.length}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentQuestionIndex((prev) =>
                  Math.min(filteredQuestions.length - 1, prev + 1)
                )
              }
              disabled={currentQuestionIndex === filteredQuestions.length - 1}
              className="flex items-center space-x-1.5 px-4 py-2 bg-iig-navy hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-white transition-colors"
            >
              <span>Câu tiếp</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
