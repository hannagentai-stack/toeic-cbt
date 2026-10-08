import React, { useState, useMemo, useEffect } from 'react';
import type { ExamData, Question, Passage, OptionLabel } from '../../../types/exam';
import { useReadingStore } from '../../../store/useReadingStore';
import { ReadingHeader } from './ReadingHeader';
import { QuestionPalette } from './QuestionPalette';
import { Part5View } from './Part5View';
import { Part6View } from './Part6View';
import { Part7View } from './Part7View';
import { SubmitModal } from './SubmitModal';
import { FiveMinAlertModal } from './FiveMinAlertModal';

interface ReadingExamModuleProps {
  examData: ExamData;
  onSubmitExam: () => void;
}

export const ReadingExamModule: React.FC<ReadingExamModuleProps> = ({
  examData,
  onSubmitExam,
}) => {
  const {
    currentQuestionNumber,
    showSubmitModal,
    showFiveMinAlert,
    isSubmitted,
    jumpToQuestion,
    selectAnswer,
    toggleFlag,
    nextQuestion,
    prevQuestion,
  } = useReadingStore();

  // 1. Lọc toàn bộ câu hỏi phần Reading (Part 5, 6, 7)
  const readingQuestions = useMemo(() => {
    return examData.questions
      .filter((q) => q.part_number >= 5)
      .sort((a, b) => a.question_number - b.question_number);
  }, [examData.questions]);

  const questionNumbers = useMemo(
    () => readingQuestions.map((q) => q.question_number),
    [readingQuestions]
  );

  // 2. Lấy thông tin câu hỏi đang hoạt động (active question)
  const activeQuestion = useMemo(() => {
    return (
      readingQuestions.find((q) => q.question_number === currentQuestionNumber) ||
      readingQuestions[0]
    );
  }, [readingQuestions, currentQuestionNumber]);

  // Đảm bảo currentQuestionNumber trỏ đúng vào một câu thuộc Reading khi mới mount
  useEffect(() => {
    if (readingQuestions.length > 0 && !questionNumbers.includes(currentQuestionNumber)) {
      jumpToQuestion(readingQuestions[0].question_number);
    }
  }, [readingQuestions, questionNumbers, currentQuestionNumber, jumpToQuestion]);

  // Tự động nộp bài khi hết 75 phút
  useEffect(() => {
    if (isSubmitted) {
      onSubmitExam();
    }
  }, [isSubmitted, onSubmitExam]);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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

  // Phím tắt bàn phím toàn cục cho Reading: A, B, C, D, F, Mũi tên
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (showSubmitModal || showFiveMinAlert) return;

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key) && activeQuestion) {
        selectAnswer(activeQuestion.question_number, key as OptionLabel);
      } else if (key === 'F' && activeQuestion) {
        toggleFlag(activeQuestion.question_number);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || key === 'N') {
        nextQuestion(questionNumbers);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || key === 'P') {
        prevQuestion(questionNumbers);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeQuestion, questionNumbers, showSubmitModal, showFiveMinAlert, selectAnswer, toggleFlag, nextQuestion, prevQuestion]);

  // 3. Phân loại theo Part để render component tương ứng
  const activePartNumber = activeQuestion ? activeQuestion.part_number : 5;

  // Lọc câu hỏi Part 5
  const part5Questions = useMemo(() => {
    return readingQuestions.filter((q) => q.part_number === 5);
  }, [readingQuestions]);

  // Tìm Passage tương ứng cho Part 6 và Part 7
  const activePassage = useMemo<Passage | undefined>(() => {
    if (!activeQuestion) return undefined;
    return examData.passages.find((p) => p.id_ref === activeQuestion.passage_id_ref);
  }, [examData.passages, activeQuestion]);

  // Lọc các câu hỏi con thuộc chung Passage đó cho Part 6 và Part 7
  const activePassageQuestions = useMemo<Question[]>(() => {
    if (!activePassage) return [activeQuestion].filter(Boolean) as Question[];
    return readingQuestions.filter((q) => q.passage_id_ref === activePassage.id_ref);
  }, [readingQuestions, activePassage, activeQuestion]);

  return (
    <div className="h-screen max-h-screen bg-slate-100 flex flex-col overflow-hidden">
      {/* 1. Header cố định: Đồng hồ 75 phút & nút Nộp bài */}
      <ReadingHeader
        testTitle={examData.test.title}
        totalReadingQuestions={readingQuestions.length}
      />

      {/* 2. Vùng làm bài chính + Bảng điều hướng câu hỏi bên phải */}
      <div className="flex-1 flex overflow-hidden">
        {/* Khu vực hiển thị câu hỏi Part 5 / 6 / 7 */}
        <main className={`flex-1 ${activePartNumber === 5 ? 'overflow-y-auto' : 'overflow-hidden'}`}>
          {activePartNumber === 5 && (
            <Part5View questions={part5Questions} />
          )}

          {activePartNumber === 6 && (
            <Part6View
              passage={
                activePassage || {
                  id_ref: 'p6_default',
                  part_number: 6,
                  title: 'Part 6: Text Completion',
                  content: activeQuestion?.question_text || '',
                  order_index: 1,
                }
              }
              questions={activePassageQuestions}
            />
          )}

          {activePartNumber === 7 && (
            <Part7View
              passage={
                activePassage || {
                  id_ref: 'p7_default',
                  part_number: 7,
                  title: 'Part 7: Reading Comprehension',
                  content: activeQuestion?.question_text || '',
                  order_index: 1,
                }
              }
              questions={activePassageQuestions}
            />
          )}
        </main>

        {/* Bảng điều hướng 100 câu phía bên phải */}
        <QuestionPalette
          questions={readingQuestions}
          onSelectQuestion={(qNum) => jumpToQuestion(qNum)}
        />
      </div>

      {/* 3. Modal xác nhận nộp bài (hiện số câu chưa làm) */}
      {showSubmitModal && (
        <SubmitModal
          totalQuestions={readingQuestions.length}
          questionNumbers={questionNumbers}
          onConfirmSubmit={onSubmitExam}
        />
      )}

      {/* 4. Modal cảnh báo khi còn 5 phút */}
      {showFiveMinAlert && <FiveMinAlertModal />}

      {/* 5. Banner mất kết nối mạng / Offline safe */}
      {isOffline && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-amber-600 text-white text-xs px-4 py-1.5 text-center font-bold flex items-center justify-center space-x-2 shadow-lg animate-pulse">
          <span>⚡ Mất kết nối Internet! Tiến độ bài làm đang được tự động lưu trên trình duyệt (Offline Safe).</span>
        </div>
      )}
    </div>
  );
};
