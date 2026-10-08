import React, { useState, useEffect, useRef } from 'react';
import { CbtTopBar } from './CbtTopBar';
import { CbtRightPalette } from './CbtRightPalette';
import { CbtPreExamCheck } from './CbtPreExamCheck';
import { CbtSectionTransition } from './CbtSectionTransition';
import { CbtSubmitConfirmModal } from './CbtSubmitConfirmModal';
import {
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Volume2,
  RotateCcw,
  FileText,
  Play,
  Pause,
  WifiOff,
} from 'lucide-react';
import type { ExamData, OptionLabel } from '../../../types/exam';
import { getReadingFontClass } from '../../../utils/fontStyles';
import { useExamSessionStore } from '../../../store/useExamSessionStore';
import { attemptService } from '../../../services/attemptService';
import { mediaService } from '../../../services/mediaService';

interface CbtExamLayoutProps {
  examData: ExamData;
  onFinishExam: (
    submittedAnswers?: Record<number, OptionLabel>,
    actualTimeSpentSeconds?: number
  ) => void;
}

export const CbtExamLayout: React.FC<CbtExamLayoutProps> = ({
  examData,
  onFinishExam,
}) => {
  const { config, getRules } = useExamSessionStore();
  const rules = getRules();
  const [screen, setScreen] = useState<'CHECK' | 'EXAM' | 'TRANSITION'>('EXAM');
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number>(() => {
    return examData.questions[0]?.question_number || 1;
  });
  const [fontSizeScale, setFontSizeScale] = useState<'NORMAL' | 'LARGE' | 'HUGE'>('NORMAL');

  const [answers, setAnswers] = useState<Record<number, OptionLabel>>(() => {
    try {
      const saved = localStorage.getItem('toeic_cbt_answers');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('toeic_cbt_flags');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved');
  const debounceSaveTimerRef = useRef<any>(null);

  // Audio State & Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasPlayedMap, setHasPlayedMap] = useState<Record<number, boolean>>({});

  // 1. Quản lý đồng hồ thi: Đếm ngược theo kỹ năng/quy tắc hoặc Đếm lên nếu tắt timer
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('toeic_cbt_remaining_seconds');
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num) && num > 0) return num;
      }
    } catch {}
    return rules.durationSeconds || 7200;
  });
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('toeic_cbt_elapsed_seconds');
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num) && num >= 0) return num;
      }
    } catch {}
    return 0;
  });

  useEffect(() => {
    if (rules.timerEnabled) {
      const saved = sessionStorage.getItem('toeic_cbt_remaining_seconds');
      if (!saved) setRemainingSeconds(rules.durationSeconds || 7200);
    } else {
      const saved = sessionStorage.getItem('toeic_cbt_elapsed_seconds');
      if (!saved) setElapsedSeconds(0);
    }
  }, [rules.timerEnabled, rules.durationSeconds]);

  // Bộ đếm thời gian
  useEffect(() => {
    if (screen !== 'EXAM') return;

    const timer = setInterval(() => {
      if (rules.timerEnabled) {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          const next = prev - 1;
          try {
            sessionStorage.setItem('toeic_cbt_remaining_seconds', String(next));
          } catch {}
          return next;
        });
      } else {
        // Mode practice tắt đồng hồ: Chạy đếm lên
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          try {
            sessionStorage.setItem('toeic_cbt_elapsed_seconds', String(next));
          } catch {}
          return next;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, rules.timerEnabled]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const displayTime = rules.timerEnabled
    ? formatTime(remainingSeconds)
    : `${formatTime(elapsedSeconds)} (Đếm lên)`;

  const getActualTimeSpent = () => {
    return rules.timerEnabled
      ? Math.max(1, (rules.durationSeconds || 7200) - remainingSeconds)
      : Math.max(1, elapsedSeconds);
  };

  const handleConfirmSubmit = () => {
    try {
      localStorage.removeItem('toeic_cbt_answers');
      localStorage.removeItem('toeic_cbt_flags');
      sessionStorage.removeItem('toeic_cbt_remaining_seconds');
      sessionStorage.removeItem('toeic_cbt_elapsed_seconds');
    } catch {}
    attemptService.clearInProgressAttempt(examData.test.code);
    setShowSubmitModal(false);
    onFinishExam(answers, getActualTimeSpent());
  };

  const handleAutoSubmit = () => {
    try {
      localStorage.removeItem('toeic_cbt_answers');
      localStorage.removeItem('toeic_cbt_flags');
      sessionStorage.removeItem('toeic_cbt_remaining_seconds');
      sessionStorage.removeItem('toeic_cbt_elapsed_seconds');
    } catch {}
    attemptService.clearInProgressAttempt(examData.test.code);
    setShowSubmitModal(false);
    onFinishExam(answers, getActualTimeSpent());
  };

  // Tự động lưu tiến độ làm dở (Debounced autosave) vào Supabase attempts
  useEffect(() => {
    if (screen !== 'EXAM') return;
    if (Object.keys(answers).length === 0) return;

    setSaveStatus('saving');
    if (debounceSaveTimerRef.current) {
      clearTimeout(debounceSaveTimerRef.current);
    }

    debounceSaveTimerRef.current = setTimeout(async () => {
      try {
        const timeSpent = getActualTimeSpent();
        const res = await attemptService.saveInProgressProgress(
          examData.test.code,
          examData.test.title,
          answers,
          timeSpent,
          config.mode,
          {
            ...config,
            currentQuestionNumber,
            flaggedQuestions,
            remainingSeconds,
            elapsedSeconds,
          }
        );
        if (isOffline) {
          setSaveStatus('offline');
        } else {
          setSaveStatus(res.success ? 'saved' : 'offline');
        }
      } catch {
        setSaveStatus('offline');
      }
    }, 1200);

    return () => {
      if (debounceSaveTimerRef.current) {
        clearTimeout(debounceSaveTimerRef.current);
      }
    };
  }, [answers, currentQuestionNumber, flaggedQuestions, remainingSeconds, isOffline, screen]);

  useEffect(() => {
    if (examData.questions.length > 0) {
      if (!examData.questions.some((q) => q.question_number === currentQuestionNumber)) {
        setCurrentQuestionNumber(examData.questions[0].question_number);
      }
    }
  }, [examData]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const candidateName = config?.candidate?.fullName || 'NGUYỄN VĂN AN';
  const candidateId = config?.candidate?.candidateId || 'VN-882901-CBT';

  const questions = examData.questions;
  const activeQuestion =
    questions.find((q) => q.question_number === currentQuestionNumber) || questions[0];

  const activePassage = examData.passages.find(
    (p) => p.id_ref === activeQuestion?.passage_id_ref
  );
  const activeAudioUrl = activeQuestion?.audio_url || activePassage?.audio_url || null;
  const isListeningQuestion =
    (activeQuestion && activeQuestion.part_number <= 4) || Boolean(activeAudioUrl);

  // Lấy audio URL tối ưu (từ memory cache nếu đã preload, hoặc signed url)
  const playableAudioUrl = activeAudioUrl ? mediaService.getPlayableAudioUrl(activeAudioUrl) : '';

  // Lấy image URL có chữ ký nếu ở private bucket Storage
  const rawImageUrl = activeQuestion?.image_url || activePassage?.image_url || null;
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    if (rawImageUrl) {
      mediaService.getSignedMediaUrl(rawImageUrl).then((url) => {
        if (isMounted) setResolvedImageUrl(url);
      });
    } else {
      setResolvedImageUrl('');
    }
    return () => {
      isMounted = false;
    };
  }, [rawImageUrl]);

  // Bộ định thời tự động làm mới Signed URL nếu phiên thi kéo dài gần 2 giờ
  useEffect(() => {
    const timer = setInterval(() => {
      mediaService.refreshExpiringSignedUrls();
    }, 10 * 60 * 1000); // 10 phút kiểm tra 1 lần
    return () => clearInterval(timer);
  }, []);

  // Tự động phát âm thanh ở bài thi thật (chỉ phát 1 lần cho mỗi câu)
  useEffect(() => {
    if (screen !== 'EXAM') return;
    setIsPlayingAudio(false);

    if (playableAudioUrl && audioRef.current) {
      if (rules.isRealExam && !hasPlayedMap[currentQuestionNumber]) {
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .then(() => {
            setIsPlayingAudio(true);
            setHasPlayedMap((prev) => ({ ...prev, [currentQuestionNumber]: true }));
          })
          .catch(() => {
            // Browser autoplay restrictions handled silently
          });
      }
    }
  }, [currentQuestionNumber, activeAudioUrl, screen, rules.isRealExam]);

  const handleSelectOption = (label: OptionLabel) => {
    setAnswers((prev) => {
      const next = { ...prev, [currentQuestionNumber]: label };
      try {
        localStorage.setItem('toeic_cbt_answers', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleFlag = (qNum: number) => {
    setFlaggedQuestions((prev) => {
      const next = prev.includes(qNum) ? prev.filter((id) => id !== qNum) : [...prev, qNum];
      try {
        localStorage.setItem('toeic_cbt_flags', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleToggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch(console.error);
    }
  };

  const handleReplayAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .then(() => setIsPlayingAudio(true))
      .catch(console.error);
  };

  const isFlagged = flaggedQuestions.includes(currentQuestionNumber);
  const chosenOption = answers[currentQuestionNumber];

  // Phím tắt bàn phím toàn cục cho CBT: A, B, C, D, N, P, F, Mũi tên
  useEffect(() => {
    if (screen !== 'EXAM' || !activeQuestion) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (showSubmitModal) return;

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        handleSelectOption(key as OptionLabel);
      } else if (e.key === 'ArrowRight' || key === 'N') {
        const idx = questions.findIndex((q) => q.question_number === currentQuestionNumber);
        if (idx < questions.length - 1)
          setCurrentQuestionNumber(questions[idx + 1].question_number);
      } else if (e.key === 'ArrowLeft' || key === 'P') {
        if (activeQuestion.part_number <= 4 && !rules.allowGoBackInListening) {
          return; // Khóa quay lại câu nghe trong thi thật
        }
        const idx = questions.findIndex((q) => q.question_number === currentQuestionNumber);
        if (idx > 0) setCurrentQuestionNumber(questions[idx - 1].question_number);
      } else if (key === 'F') {
        toggleFlag(currentQuestionNumber);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, activeQuestion, currentQuestionNumber, questions, showSubmitModal, rules.allowGoBackInListening]);

  // 1. Màn hình kiểm tra trước khi thi
  if (screen === 'CHECK') {
    return (
      <CbtPreExamCheck
        candidateName={candidateName}
        candidateId={candidateId}
        testTitle={examData.test.title}
        onEnterExam={() => setScreen('EXAM')}
      />
    );
  }

  // 2. Màn hình chuyển tiếp giữa 2 phần thi
  if (screen === 'TRANSITION') {
    return (
      <CbtSectionTransition
        onStartReading={() => {
          const firstReadingQ = questions.find((q) => q.part_number >= 5);
          if (firstReadingQ) {
            setCurrentQuestionNumber(firstReadingQ.question_number);
          }
          setScreen('EXAM');
        }}
      />
    );
  }

  const isReadingPassageQuestion = Boolean(
    activeQuestion && activeQuestion.part_number >= 6 && activePassage
  );

  // 3. Màn hình phòng thi chính thức chuẩn IIG CBT
  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden font-sans">
      {/* Cảnh báo khi mất mạng trong phòng thi */}
      {isOffline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between border-b border-amber-600 shadow-sm z-50">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              Mất kết nối Internet! Đáp án của bạn đang được tự động lưu an toàn tuyệt đối trên máy và sẽ tự đồng bộ khi có mạng trở lại.
            </span>
          </div>
          <span className="px-2 py-0.5 bg-black/20 rounded text-[10px] uppercase font-bold tracking-wider hidden sm:inline-block">
            Chế độ ngoại tuyến an toàn
          </span>
        </div>
      )}

      {/* 1. THANH TRÊN CÙNG (TOP BAR) */}
      <CbtTopBar
        candidateName={candidateName}
        candidateId={candidateId}
        timeFormatted={displayTime}
        currentPartTitle={`Part ${activeQuestion?.part_number || 5}`}
        currentQuestionNumber={activeQuestion?.question_number}
        totalQuestions={questions.length}
        answeredCount={Object.keys(answers).length}
        fontSizeScale={fontSizeScale}
        onIncreaseFontSize={() =>
          setFontSizeScale((prev) => (prev === 'NORMAL' ? 'LARGE' : 'HUGE'))
        }
        onDecreaseFontSize={() =>
          setFontSizeScale((prev) => (prev === 'HUGE' ? 'LARGE' : 'NORMAL'))
        }
        onSubmitClick={() => setShowSubmitModal(true)}
        isOffline={isOffline}
        saveStatus={saveStatus}
      />

      {/* 2. KHU VỰC THI CHÍNH + PALETTE BÊN PHẢI */}
      <div className="flex-1 flex overflow-hidden">
        {/* NỘI DUNG CÂU HỎI */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col justify-between bg-slate-100">
          <div className="max-w-5xl mx-auto w-full space-y-5">
            {/* Header câu hỏi */}
            <div className="flex items-center justify-between border-b border-slate-300 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-slate-900 font-mono">
                  Question {activeQuestion?.question_number} of {questions.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  (Part {activeQuestion?.part_number})
                </span>
                {config.mode === 'practice' && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                    Luyện tập
                  </span>
                )}
              </div>

              {/* Nút Flag */}
              <button
                type="button"
                onClick={() => toggleFlag(activeQuestion.question_number)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded border text-xs font-bold transition-colors cursor-pointer ${
                  isFlagged
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current' : ''}`} />
                <span>{isFlagged ? 'Đã đánh dấu (Flagged)' : 'Đánh dấu (Flag)'}</span>
              </button>
            </div>

            {/* THANH ĐIỀU KHIỂN ÂM THANH CHO CÂU HỎI LISTENING */}
            {isListeningQuestion && activeAudioUrl && (
              <div className="bg-slate-900 text-white rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 shadow-md border border-slate-700">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleToggleAudio}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      isPlayingAudio
                        ? 'bg-emerald-500 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    title={isPlayingAudio ? 'Tạm dừng audio' : 'Phát audio'}
                  >
                    {isPlayingAudio ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center space-x-2">
                      <Volume2 className="w-4 h-4 text-sky-400" />
                      <span>Âm thanh câu hỏi (Listening Audio)</span>
                      {isPlayingAudio && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-medium">
                          Đang phát...
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {rules.allowReplayAudio
                        ? 'Chế độ luyện tập: Cho phép nghe lại nhiều lần'
                        : 'Quy chuẩn thi ETS: Băng phát tự động 1 lần'}
                    </p>
                  </div>
                </div>

                {/* NÚT NGHE LẠI (Replay Audio) - Hiển thị nếu allowReplayAudio = true */}
                {rules.allowReplayAudio ? (
                  <button
                    type="button"
                    onClick={handleReplayAudio}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
                    title="Nghe lại đoạn audio này từ đầu"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Nghe lại</span>
                  </button>
                ) : (
                  <span className="text-xs text-amber-300/80 font-mono italic">
                    (Phát 1 lần theo chuẩn ETS)
                  </span>
                )}

                {/* Thẻ audio ẩn */}
                <audio
                  ref={audioRef}
                  src={playableAudioUrl || undefined}
                  onPlay={() => setIsPlayingAudio(true)}
                  onEnded={() => setIsPlayingAudio(false)}
                  onPause={() => setIsPlayingAudio(false)}
                />
              </div>
            )}

            {/* BỐ CỤC KHUNG NỘI DUNG CHÍNH (CHIA CỘT NẾU LÀ ĐOẠN VĂN PART 6-7) */}
            <div
              className={`grid gap-6 ${
                isReadingPassageQuestion ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
              }`}
            >
              {/* CỘT ĐOẠN VĂN (DÀNH CHO PART 6 & PART 7) */}
              {isReadingPassageQuestion && activePassage && (
                <div className="lg:col-span-6 bg-white border border-slate-300 rounded-xl p-5 shadow-sm max-h-[580px] overflow-y-auto space-y-3">
                  <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 text-xs font-bold text-slate-700">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>{activePassage.title || `Passage (Part ${activeQuestion.part_number})`}</span>
                  </div>
                  <div
                    className={`text-slate-800 whitespace-pre-line leading-relaxed font-serif ${getReadingFontClass(
                      fontSizeScale
                    )}`}
                  >
                    {activePassage.content}
                  </div>
                </div>
              )}

              {/* CỘT CÂU HỎI & CÁC LỰA CHỌN */}
              <div
                className={`${
                  isReadingPassageQuestion ? 'lg:col-span-6' : 'w-full'
                } bg-white border border-slate-300 rounded-xl p-6 shadow-sm space-y-6`}
              >
                {/* HÌNH ẢNH MINH HỌA (Part 1 photographs hoặc biểu đồ Part 3) */}
                {(activeQuestion?.image_url || activePassage?.image_url) && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-center items-center">
                    <img
                      src={resolvedImageUrl || rawImageUrl || ''}
                      alt="Question illustration"
                      className="max-h-64 object-contain rounded-lg shadow-sm"
                    />
                  </div>
                )}

                {/* Tiêu đề & nội dung câu hỏi */}
                <p
                  className={`font-medium text-slate-900 leading-relaxed ${getReadingFontClass(
                    fontSizeScale
                  )}`}
                >
                  <span className="font-bold text-slate-900 mr-2 font-mono">
                    {activeQuestion?.question_number}.
                  </span>
                  {activeQuestion?.question_text ||
                    'Select the best answer to complete the sentence or statement.'}
                </p>

                {/* 4 Lựa chọn chuẩn thi máy: Bấm cả ô, có trạng thái rõ ràng, phím tắt A/B/C/D */}
                <div className="space-y-3">
                  {activeQuestion?.options.map((opt) => {
                    const isSelected = chosenOption === opt.option_label;
                    return (
                      <button
                        key={opt.option_label}
                        type="button"
                        onClick={() => handleSelectOption(opt.option_label as OptionLabel)}
                        className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/90 shadow-sm ring-2 ring-blue-200'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3.5 transition-colors flex-shrink-0 ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow ring-2 ring-blue-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {opt.option_label}
                          </div>
                          <span
                            className={`leading-relaxed ${
                              isSelected
                                ? 'text-blue-950 font-bold'
                                : 'text-slate-800 font-medium'
                            } ${getReadingFontClass(fontSizeScale)}`}
                          >
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

                {/* Giải thích tức thì khi bật chế độ luyện tập xem đáp án ngay */}
                {rules.showAnswerImmediately && chosenOption && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs space-y-1.5 animate-in fade-in">
                    <div className="font-bold text-blue-900 flex items-center space-x-1.5">
                      <span>Đáp án đúng:</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-600 text-white font-black">
                        {activeQuestion.correct_option}
                      </span>
                      {chosenOption === activeQuestion.correct_option ? (
                        <span className="text-emerald-700 font-bold ml-2">
                          ✓ Bạn đã chọn chính xác!
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold ml-2">
                          ✗ Bạn đã chọn {chosenOption} (Chưa đúng)
                        </span>
                      )}
                    </div>
                    {activeQuestion.explanation && (
                      <p className="text-slate-700 pt-1 border-t border-blue-100">
                        <strong>Giải thích: </strong>
                        {activeQuestion.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer nút Previous / Next */}
          <div className="max-w-5xl mx-auto w-full pt-6 flex items-center justify-between border-t border-slate-300">
            {!(activeQuestion?.part_number <= 4 && !rules.allowGoBackInListening) ? (
              <button
                type="button"
                onClick={() => {
                  const idx = questions.findIndex(
                    (q) => q.question_number === currentQuestionNumber
                  );
                  if (idx > 0) setCurrentQuestionNumber(questions[idx - 1].question_number);
                }}
                className="px-5 py-2 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu trước (Previous)</span>
              </button>
            ) : (
              <span className="text-xs text-slate-400 italic font-medium">
                (Listening: Khóa quay lại theo quy chế thi thật)
              </span>
            )}

            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Phím tắt: [A] [B] [C] [D] • [←] [→]
            </span>

            <button
              type="button"
              onClick={() => {
                const idx = questions.findIndex(
                  (q) => q.question_number === currentQuestionNumber
                );
                if (idx < questions.length - 1)
                  setCurrentQuestionNumber(questions[idx + 1].question_number);
              }}
              className="px-6 py-2 rounded bg-iig-navy hover:bg-blue-900 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <span>Câu tiếp theo (Next)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>

        {/* BẢNG ĐIỀU HƯỚNG CÂU HỎI BÊN PHẢI */}
        <CbtRightPalette
          questions={questions}
          currentQuestionNumber={currentQuestionNumber}
          answers={answers}
          flaggedQuestions={flaggedQuestions}
          onSelectQuestion={(qNum) => setCurrentQuestionNumber(qNum)}
        />
      </div>

      {/* MODAL XÁC NHẬN NỘP BÀI */}
      {showSubmitModal && (
        <CbtSubmitConfirmModal
          totalQuestions={questions.length}
          answeredCount={Object.keys(answers).length}
          flaggedCount={flaggedQuestions.length}
          unansweredQuestionNumbers={questions
            .filter((q) => answers[q.question_number] === undefined)
            .map((q) => q.question_number)}
          onSelectQuestion={(qNum) => setCurrentQuestionNumber(qNum)}
          onCancel={() => setShowSubmitModal(false)}
          onConfirm={handleConfirmSubmit}
        />
      )}

      {/* BANNER MẤT MẠNG / OFFLINE SAFE */}
      {isOffline && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-amber-600 text-white text-xs px-4 py-1.5 text-center font-bold flex items-center justify-center space-x-2 shadow-lg animate-pulse">
          <span>
            ⚡ Mất kết nối Internet! Tiến độ bài làm đang được tự động lưu trên trình duyệt (Offline Safe).
          </span>
        </div>
      )}
    </div>
  );
};
