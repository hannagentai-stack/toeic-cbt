import { create } from 'zustand';
import type { OptionLabel, ListeningPhase } from '../types/exam';

interface ListeningState {
  // Trạng thái bài làm
  answers: Record<number, OptionLabel>; // question_number -> 'A' | 'B' | 'C' | 'D'
  lockedQuestions: number[];            // Danh sách các câu đã bị khóa, không cho sửa đáp án
  
  // Điều hướng
  currentPartNumber: number;            // 1, 2, 3, 4
  currentGroupIndex: number;            // Vị trí câu (Part 1, 2) hoặc vị trí nhóm hội thoại (Part 3, 4)
  phase: ListeningPhase;                // DIRECTIONS, PRELOADING, PLAYING, SILENCE_COUNTDOWN, COMPLETED_PART, COMPLETED_ALL
  silenceRemaining: number;             // Đếm ngược số giây im lặng giữa các câu

  // Trạng thái âm thanh & thiết bị
  audioLoaded: boolean;
  audioError: string | null;
  volume: number;                       // Âm lượng tai nghe thí sinh (0 -> 1)
  isMuted: boolean;

  // Actions
  selectAnswer: (questionNumber: number, option: OptionLabel) => boolean;
  lockQuestions: (questionNumbers: number[]) => void;
  setPhase: (phase: ListeningPhase) => void;
  setSilenceRemaining: (seconds: number) => void;
  setAudioLoaded: (loaded: boolean) => void;
  setAudioError: (error: string | null) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  startPart: () => void;
  advanceGroup: () => void;
  advancePart: () => void;
  resetExam: () => void;
}

const LISTENING_STORAGE_KEY = 'toeic_listening_progress';

function loadListeningStorage() {
  try {
    const raw = localStorage.getItem(LISTENING_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

function saveListeningStorage(data: Record<string, unknown>) {
  try {
    const prev = loadListeningStorage() || {};
    localStorage.setItem(LISTENING_STORAGE_KEY, JSON.stringify({ ...prev, ...data }));
  } catch {
    // ignore
  }
}

const initialListening = loadListeningStorage();

export const useListeningStore = create<ListeningState>((set, get) => ({
  answers: initialListening?.answers || {},
  lockedQuestions: initialListening?.lockedQuestions || [],
  currentPartNumber: 1,
  currentGroupIndex: 0,
  phase: 'DIRECTIONS',
  silenceRemaining: 0,
  audioLoaded: false,
  audioError: null,
  volume: 0.85,
  isMuted: false,

  /**
   * Lưu đáp án ngay lập tức khi thí sinh bấm chọn. Tự động lưu tiến độ.
   * Nếu câu hỏi đã nằm trong danh sách lockedQuestions -> từ chối thay đổi!
   */
  selectAnswer: (questionNumber: number, option: OptionLabel) => {
    const { lockedQuestions, answers } = get();
    if (lockedQuestions.includes(questionNumber)) {
      console.warn(`[IIG Exam Lock] Câu #${questionNumber} đã bị khóa, không thể đổi đáp án.`);
      return false;
    }
    const nextAnswers = {
      ...answers,
      [questionNumber]: option,
    };
    saveListeningStorage({ answers: nextAnswers });
    set({
      answers: nextAnswers,
    });
    return true;
  },

  /**
   * Khóa vĩnh viễn danh sách câu hỏi sau khi audio đã chuyển qua câu tiếp theo
   */
  lockQuestions: (questionNumbers: number[]) => {
    const { lockedQuestions } = get();
    const newLocks = Array.from(new Set([...lockedQuestions, ...questionNumbers]));
    saveListeningStorage({ lockedQuestions: newLocks });
    set({ lockedQuestions: newLocks });
  },

  setPhase: (phase: ListeningPhase) => set({ phase }),
  
  setSilenceRemaining: (seconds: number) => set({ silenceRemaining: seconds }),

  setAudioLoaded: (loaded: boolean) => set({ audioLoaded: loaded }),

  setAudioError: (error: string | null) => set({ audioError: error }),

  setVolume: (volume: number) => set({ volume: Math.max(0, Math.min(1, volume)), isMuted: false }),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  startPart: () => {
    set({
      phase: 'PRELOADING',
      currentGroupIndex: 0,
      audioError: null,
      audioLoaded: false,
    });
  },

  advanceGroup: () => {
    set((state) => ({
      currentGroupIndex: state.currentGroupIndex + 1,
      phase: 'PLAYING',
      silenceRemaining: 0,
    }));
  },

  advancePart: () => {
    set((state) => {
      const nextPart = state.currentPartNumber + 1;
      if (nextPart > 4) {
        return {
          phase: 'COMPLETED_ALL',
        };
      }
      return {
        currentPartNumber: nextPart,
        currentGroupIndex: 0,
        phase: 'DIRECTIONS',
        audioLoaded: false,
        audioError: null,
      };
    });
  },

  resetExam: () => {
    try {
      localStorage.removeItem(LISTENING_STORAGE_KEY);
    } catch {}
    set({
      answers: {},
      lockedQuestions: [],
      currentPartNumber: 1,
      currentGroupIndex: 0,
      phase: 'DIRECTIONS',
      silenceRemaining: 0,
      audioLoaded: false,
      audioError: null,
    });
  },
}));
