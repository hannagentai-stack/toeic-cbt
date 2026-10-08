import { create } from 'zustand';
import type { OptionLabel, Part5ViewMode } from '../types/exam';

export type FontSizeScale = 'NORMAL' | 'LARGE' | 'HUGE';

interface ReadingState {
  // Trạng thái bài làm Reading (Part 5 - Part 7)
  answers: Record<number, OptionLabel>; // question_number -> 'A' | 'B' | 'C' | 'D'
  flaggedQuestions: number[];           // Danh sách câu hỏi được đánh dấu xem lại (Flag)
  currentQuestionNumber: number;        // Câu hỏi đang được focus
  part5ViewMode: Part5ViewMode;         // 'SINGLE' (1 câu/màn hình) hoặc 'LIST' (danh sách cuộn)

  // Tùy chọn cỡ chữ hiển thị (Normal 16-18px, Large 18-20px, Huge 20-22px)
  fontSizeScale: FontSizeScale;

  // Thời gian đếm ngược (75 phút = 4500 giây)
  timeRemainingSeconds: number;
  isTimeRunning: boolean;
  showFiveMinAlert: boolean;
  isFiveMinWarningDismissed: boolean;

  // Tính năng Highlight văn bản Part 7 (Lưu mảng đoạn văn đã highlight theo passageId)
  highlights: Record<string, string[]>;

  // Trạng thái nộp bài
  showSubmitModal: boolean;
  isSubmitted: boolean;

  // Actions
  selectAnswer: (questionNumber: number, option: OptionLabel) => void;
  toggleFlag: (questionNumber: number) => void;
  jumpToQuestion: (questionNumber: number) => void;
  nextQuestion: (allQuestions: number[]) => void;
  prevQuestion: (allQuestions: number[]) => void;
  setPart5ViewMode: (mode: Part5ViewMode) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  decrementTimer: () => void;
  addHighlight: (passageId: string, text: string) => void;
  clearPassageHighlights: (passageId: string) => void;
  openSubmitModal: () => void;
  closeSubmitModal: () => void;
  dismissFiveMinAlert: () => void;
  submitExam: () => void;
  resetReading: () => void;
}

const READING_STORAGE_KEY = 'toeic_reading_progress';

function loadReadingStorage() {
  try {
    const raw = localStorage.getItem(READING_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

function saveReadingStorage(data: Record<string, unknown>) {
  try {
    const prev = loadReadingStorage() || {};
    localStorage.setItem(READING_STORAGE_KEY, JSON.stringify({ ...prev, ...data }));
  } catch {
    // ignore
  }
}

const initialSaved = loadReadingStorage();

export const useReadingStore = create<ReadingState>((set, get) => ({
  answers: initialSaved?.answers || {},
  flaggedQuestions: initialSaved?.flaggedQuestions || [],
  currentQuestionNumber: 101, // Mặc định câu bắt đầu của Reading là 101 (hoặc câu đầu tiên của Part 5)
  part5ViewMode: 'SINGLE',
  fontSizeScale: (initialSaved?.fontSizeScale as FontSizeScale) || 'NORMAL',
  timeRemainingSeconds: typeof initialSaved?.timeRemainingSeconds === 'number' ? initialSaved.timeRemainingSeconds : 75 * 60, // 75 phút
  isTimeRunning: true,
  showFiveMinAlert: false,
  isFiveMinWarningDismissed: false,
  highlights: initialSaved?.highlights || {},
  showSubmitModal: false,
  isSubmitted: false,

  /**
   * Thí sinh chọn đáp án: Có thể chọn hoặc đổi đáp án tự do trong suốt 75 phút. Tự động lưu tiến độ.
   */
  selectAnswer: (questionNumber: number, option: OptionLabel) => {
    set((state) => {
      const nextAnswers = {
        ...state.answers,
        [questionNumber]: option,
      };
      saveReadingStorage({ answers: nextAnswers });
      return { answers: nextAnswers };
    });
  },

  /**
   * Bật/tắt cờ Flag câu hỏi
   */
  toggleFlag: (questionNumber: number) => {
    set((state) => {
      const isFlagged = state.flaggedQuestions.includes(questionNumber);
      const newFlags = isFlagged
        ? state.flaggedQuestions.filter((q) => q !== questionNumber)
        : [...state.flaggedQuestions, questionNumber];
      saveReadingStorage({ flaggedQuestions: newFlags });
      return { flaggedQuestions: newFlags };
    });
  },

  /**
   * Nhảy trực tiếp đến câu bất kỳ
   */
  jumpToQuestion: (questionNumber: number) => {
    set({ currentQuestionNumber: questionNumber });
  },

  /**
   * Chuyển sang câu tiếp theo
   */
  nextQuestion: (allQuestions: number[]) => {
    const { currentQuestionNumber } = get();
    const currentIndex = allQuestions.indexOf(currentQuestionNumber);
    if (currentIndex !== -1 && currentIndex < allQuestions.length - 1) {
      set({ currentQuestionNumber: allQuestions[currentIndex + 1] });
    }
  },

  /**
   * Quay lại câu trước đó
   */
  prevQuestion: (allQuestions: number[]) => {
    const { currentQuestionNumber } = get();
    const currentIndex = allQuestions.indexOf(currentQuestionNumber);
    if (currentIndex > 0) {
      set({ currentQuestionNumber: allQuestions[currentIndex - 1] });
    }
  },

  setPart5ViewMode: (mode: Part5ViewMode) => {
    set({ part5ViewMode: mode });
  },

  increaseFontSize: () => {
    set((state) => {
      const nextScale: FontSizeScale = state.fontSizeScale === 'NORMAL' ? 'LARGE' : 'HUGE';
      saveReadingStorage({ fontSizeScale: nextScale });
      return { fontSizeScale: nextScale };
    });
  },

  decreaseFontSize: () => {
    set((state) => {
      const nextScale: FontSizeScale = state.fontSizeScale === 'HUGE' ? 'LARGE' : 'NORMAL';
      saveReadingStorage({ fontSizeScale: nextScale });
      return { fontSizeScale: nextScale };
    });
  },

  /**
   * Đếm ngược thời gian mỗi giây
   */
  decrementTimer: () => {
    const { timeRemainingSeconds, isFiveMinWarningDismissed } = get();
    if (timeRemainingSeconds <= 1) {
      // Hết giờ -> Tự động nộp bài!
      set({ timeRemainingSeconds: 0, isTimeRunning: false, isSubmitted: true });
      return;
    }

    const nextTime = timeRemainingSeconds - 1;
    // Cảnh báo khi còn 5 phút (300 giây)
    const shouldShowWarning = nextTime === 300 && !isFiveMinWarningDismissed;

    if (nextTime % 5 === 0) {
      saveReadingStorage({ timeRemainingSeconds: nextTime });
    }

    set({
      timeRemainingSeconds: nextTime,
      showFiveMinAlert: shouldShowWarning,
    });
  },

  /**
   * Thêm highlight cho đoạn văn bản Part 7
   */
  addHighlight: (passageId: string, text: string) => {
    if (!text || text.trim().length === 0) return;
    set((state) => {
      const currentList = state.highlights[passageId] || [];
      if (currentList.includes(text)) return state;
      const nextHighlights = {
        ...state.highlights,
        [passageId]: [...currentList, text],
      };
      saveReadingStorage({ highlights: nextHighlights });
      return {
        highlights: nextHighlights,
      };
    });
  },

  clearPassageHighlights: (passageId: string) => {
    set((state) => {
      const newHighlights = { ...state.highlights };
      delete newHighlights[passageId];
      saveReadingStorage({ highlights: newHighlights });
      return { highlights: newHighlights };
    });
  },

  openSubmitModal: () => set({ showSubmitModal: true }),
  closeSubmitModal: () => set({ showSubmitModal: false }),
  dismissFiveMinAlert: () => set({ showFiveMinAlert: false, isFiveMinWarningDismissed: true }),

  submitExam: () => {
    try {
      localStorage.removeItem(READING_STORAGE_KEY);
    } catch {}
    set({ isSubmitted: true, showSubmitModal: false, isTimeRunning: false });
  },

  resetReading: () => {
    try {
      localStorage.removeItem(READING_STORAGE_KEY);
    } catch {}
    set({
      answers: {},
      flaggedQuestions: [],
      currentQuestionNumber: 101,
      part5ViewMode: 'SINGLE',
      timeRemainingSeconds: 75 * 60,
      isTimeRunning: true,
      showFiveMinAlert: false,
      isFiveMinWarningDismissed: false,
      highlights: {},
      showSubmitModal: false,
      isSubmitted: false,
    });
  },
}));
