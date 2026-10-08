import React, { useMemo } from 'react';
import type { ExamData, Question, Passage } from '../../../types/exam';
import { useListeningStore } from '../../../store/useListeningStore';
import { useListeningTimer } from '../../../hooks/useListeningTimer';
import { DirectionsScreen } from './DirectionsScreen';
import { AudioControllerBar } from './AudioControllerBar';
import { Part1Card } from './Part1Card';
import { Part2Card } from './Part2Card';
import { Part3And4Group } from './Part3And4Group';
import { AudioErrorModal } from './AudioErrorModal';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface ListeningExamModuleProps {
  examData: ExamData;
  onListeningComplete: () => void; // Chuyển tiếp sang phần thi Reading (Part 5-7)
}

export const ListeningExamModule: React.FC<ListeningExamModuleProps> = ({
  examData,
  onListeningComplete,
}) => {
  const {
    currentPartNumber,
    currentGroupIndex,
    phase,
    answers,
    lockedQuestions,
    audioError,
    startPart,
    advanceGroup,
    advancePart,
  } = useListeningStore();

  // 1. Lọc thông tin của Part hiện tại
  const currentPartInfo = useMemo(() => {
    return (
      examData.parts.find((p) => p.part_number === currentPartNumber) || {
        part_number: currentPartNumber,
        name: `Part ${currentPartNumber}`,
        directions_text: 'Directions for this section...',
        total_questions: 0,
      }
    );
  }, [examData.parts, currentPartNumber]);

  // 2. Lọc danh sách câu hỏi thuộc Part hiện tại
  const partQuestions = useMemo(() => {
    return examData.questions
      .filter((q) => q.part_number === currentPartNumber)
      .sort((a, b) => a.question_number - b.question_number);
  }, [examData.questions, currentPartNumber]);

  // 3. Nhóm câu hỏi theo Passage đối với Part 3 & 4
  const partPassages = useMemo(() => {
    return examData.passages
      .filter((p) => p.part_number === currentPartNumber)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }, [examData.passages, currentPartNumber]);

  // 4. Xác định câu hỏi hoặc nhóm câu hỏi đang tích cực (active item)
  const isGroupedPart = currentPartNumber === 3 || currentPartNumber === 4;

  let activeQuestions: Question[] = [];
  let activePassage: Passage | undefined = undefined;
  let activeAudioUrl: string | null = null;
  let isLastInPart = false;

  if (isGroupedPart) {
    if (partPassages.length > 0) {
      activePassage = partPassages[currentGroupIndex];
      if (activePassage) {
        activeQuestions = partQuestions.filter(
          (q) => q.passage_id_ref === activePassage?.id_ref
        );
        activeAudioUrl = activePassage.audio_url || activeQuestions[0]?.audio_url || null;
        isLastInPart = currentGroupIndex >= partPassages.length - 1;
      }
    } else {
      // Nếu không có passage trong DB, tự động nhóm mỗi 3 câu
      const startIndex = currentGroupIndex * 3;
      activeQuestions = partQuestions.slice(startIndex, startIndex + 3);
      activeAudioUrl = activeQuestions[0]?.audio_url || null;
      isLastInPart = startIndex + 3 >= partQuestions.length;
    }
  } else {
    // Part 1 và Part 2: Mỗi lần làm đúng 1 câu đơn
    const currentQ = partQuestions[currentGroupIndex];
    if (currentQ) {
      activeQuestions = [currentQ];
      activeAudioUrl = currentQ.audio_url || null;
      isLastInPart = currentGroupIndex >= partQuestions.length - 1;
    }
  }

  const activeQuestionNumbers = useMemo(
    () => activeQuestions.map((q) => q.question_number),
    [activeQuestions]
  );

  // Số giây chờ im lặng: 8s cho Part 1-2, 12s cho Part 3-4
  const silenceSeconds = isGroupedPart ? 12 : 8;

  // Xử lý khi hoàn tất một câu hoặc một nhóm câu
  const handleFinishedItem = () => {
    if (isLastInPart) {
      // Hết Part hiện tại
      if (currentPartNumber >= 4) {
        // Đã hoàn thành toàn bộ 4 Part Listening -> sang Reading
        onListeningComplete();
      } else {
        advancePart();
      }
    } else {
      advanceGroup();
    }
  };

  // 5. Khởi tạo Hook điều khiển Audio Engine
  const { isPlaying, isPreloading, retryAudio } = useListeningTimer({
    audioUrl: activeAudioUrl,
    silenceSeconds,
    activeQuestionNumbers,
    onFinishedItem: handleFinishedItem,
  });

  // Tạo chuỗi hiển thị số thứ tự câu hỏi ở thanh điều khiển
  const questionNumberText = useMemo(() => {
    if (activeQuestions.length === 0) return '';
    if (activeQuestions.length === 1) {
      return `Câu ${activeQuestions[0].question_number}/100`;
    }
    return `Câu ${activeQuestions[0].question_number}-${activeQuestions[activeQuestions.length - 1].question_number}/100`;
  }, [activeQuestions]);

  // Tính tổng số câu Listening đã trả lời
  const answeredListeningCount = useMemo(() => {
    const listeningQNumbers = examData.questions
      .filter((q) => q.part_number <= 4)
      .map((q) => q.question_number);
    return listeningQNumbers.filter((num) => answers[num] !== undefined).length;
  }, [examData.questions, answers]);

  const totalListeningQuestions = useMemo(() => {
    return examData.questions.filter((q) => q.part_number <= 4).length;
  }, [examData.questions]);

  // GIAI ĐOẠN 1: Màn hình Directions
  if (phase === 'DIRECTIONS') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-between p-4 md:p-6">
        <DirectionsScreen part={currentPartInfo} onStart={startPart} />
        {/* Thanh trạng thái chân trang */}
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between text-xs text-slate-500 py-3 border-t border-slate-200">
          <span>Kỳ thi TOEIC Listening & Reading - Format máy tính IIG</span>
          <span>Tiến độ phần Nghe: {answeredListeningCount}/{totalListeningQuestions} câu</span>
        </div>
      </div>
    );
  }

  // GIAI ĐOẠN 2: Đã hoàn tất toàn bộ phần Listening
  if (phase === 'COMPLETED_ALL') {
    return (
      <div className="max-w-2xl mx-auto my-16 bg-white p-8 rounded-2xl shadow-xl text-center space-y-6 border border-slate-200">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">
          Hoàn thành phần thi Listening (Part 1 - 4)!
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Bạn đã hoàn thành toàn bộ câu hỏi phần thi Nghe. Bây giờ hệ thống sẽ chuyển sang phần thi Đọc (Reading - Part 5, 6, 7) với thời gian 75 phút.
        </p>
        <button
          type="button"
          onClick={onListeningComplete}
          className="px-8 py-3.5 bg-iig-accent hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 mx-auto"
        >
          <span>Bắt đầu phần thi Reading</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // GIAI ĐOẠN 3: Đang thi làm bài (Part 1, 2, 3, 4)
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Thanh điều khiển âm thanh & trạng thái phía trên cùng */}
      <AudioControllerBar
        currentPart={currentPartNumber}
        questionNumberText={questionNumberText}
        isPlaying={isPlaying}
        isPreloading={isPreloading}
        answeredCount={answeredListeningCount}
        totalListeningQuestions={totalListeningQuestions}
      />

      {/* Vùng hiển thị câu hỏi tùy theo từng Part */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {currentPartNumber === 1 && activeQuestions[0] && (
          <Part1Card question={activeQuestions[0]} />
        )}

        {currentPartNumber === 2 && activeQuestions[0] && (
          <Part2Card question={activeQuestions[0]} isPlaying={isPlaying} />
        )}

        {(currentPartNumber === 3 || currentPartNumber === 4) && activeQuestions.length > 0 && (
          <Part3And4Group passage={activePassage} questions={activeQuestions} />
        )}
      </main>

      {/* Thanh trạng thái dưới cùng: Tiến độ làm bài và số câu đã khóa */}
      <footer className="bg-white border-t border-slate-200 px-6 py-3 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <span>
            Đã làm: <strong className="text-slate-900">{answeredListeningCount}/{totalListeningQuestions}</strong> câu
          </span>
          <span className="text-slate-300">|</span>
          <span>
            Đã khóa: <strong className="text-rose-600">{lockedQuestions.length}</strong> câu
          </span>
        </div>
        <div className="text-slate-400">
          * Trong chế độ thi thật, thí sinh không thể quay lại câu đã làm sau khi chuyển câu.
        </div>
      </footer>

      {/* Modal cảnh báo và cho thử lại nếu audio gặp sự cố */}
      {audioError && (
        <AudioErrorModal errorMessage={audioError} onRetry={retryAudio} />
      )}
    </div>
  );
};
