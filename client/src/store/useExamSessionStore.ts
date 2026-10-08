import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ExamMode,
  TestSessionConfig,
  CandidateInfo,
  PrepStep,
  ExamRules,
  ExamData,
} from '../types/exam';
import { getExamRules } from '../types/session';
import { attemptService } from '../services/attemptService';

const DEFAULT_CANDIDATE: CandidateInfo = {
  fullName: 'NGUYỄN VĂN AN',
  dateOfBirth: '2000-01-15',
  candidateId: 'VN-882901-CBT',
  email: 'candidate@toeic.edu.vn',
  targetScore: 750,
};

const DEFAULT_CONFIG: TestSessionConfig = {
  mode: 'full',
  testId: 'MINI_TEST_ETS_DEMO',
  testTitle: 'ETS TOEIC Mini Test - Demo 14 Questions (IIG Format)',
  skill: 'listening',
  parts: [5],
  options: {
    timerEnabled: true,
    allowReplayAudio: false,
    showAnswerImmediately: false,
    shuffleQuestions: false,
  },
  candidate: DEFAULT_CANDIDATE,
  isSoundVerified: false,
  isTermsAccepted: false,
};

const STEP_ORDER: PrepStep[] = [
  'MODE_SELECT',
  'TEST_SELECT',
  'OPTIONS',
  'CANDIDATE_INFO',
  'SOUND_CHECK',
  'INSTRUCTIONS',
];

export interface ExamSessionState {
  currentStep: PrepStep;
  config: TestSessionConfig;

  // Actions
  setStep: (step: PrepStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setMode: (mode: ExamMode) => void;
  setTest: (testId: string, testTitle?: string) => void;
  setSkill: (skill: 'listening' | 'reading') => void;
  setParts: (parts: number[]) => void;
  togglePart: (part: number) => void;
  setOptions: (options: Partial<TestSessionConfig['options']>) => void;
  setCandidate: (candidate: Partial<CandidateInfo>) => void;
  setConfig: (partial: Partial<TestSessionConfig>) => void;
  setMistakeAttemptId: (attemptId: string) => void;
  setSoundVerified: (verified: boolean) => void;
  setTermsAccepted: (accepted: boolean) => void;
  resetSession: () => void;

  // Compatibility aliases
  setCandidateInfo: (info: Partial<CandidateInfo>) => void;
  setPracticeOptions: (options: Partial<TestSessionConfig['options']>) => void;
  togglePartSelection: (part: number) => void;
  setSkillChoice: (choice: 'LISTENING' | 'READING' | 'listening' | 'reading') => void;

  // Computed helper
  getRules: () => ExamRules;

  // Filter exam data based on session mode & rules
  buildActiveExamData: (baseExam: ExamData) => ExamData;
}

export const useExamSessionStore = create<ExamSessionState>()(
  persist(
    (set, get) => ({
      currentStep: 'MODE_SELECT',
      config: DEFAULT_CONFIG,

      setStep: (step: PrepStep) => set({ currentStep: step }),

      nextStep: () => {
        const { currentStep, config } = get();
        const currentIndex = STEP_ORDER.indexOf(currentStep);

        if (currentIndex < STEP_ORDER.length - 1) {
          let nextIdx = currentIndex + 1;
          const isReadingOnly =
            (config.mode === 'skill' && config.skill === 'reading') ||
            (config.mode === 'practice' &&
              config.parts &&
              config.parts.length > 0 &&
              config.parts.every((p) => p >= 5));

          if (STEP_ORDER[nextIdx] === 'SOUND_CHECK' && isReadingOnly) {
            // Tự động bỏ qua sound check khi chỉ thi Reading
            nextIdx += 1;
          }
          set({ currentStep: STEP_ORDER[nextIdx] });
        }
      },

      prevStep: () => {
        const { currentStep, config } = get();
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        if (currentIndex > 0) {
          let prevIdx = currentIndex - 1;
          const isReadingOnly =
            (config.mode === 'skill' && config.skill === 'reading') ||
            (config.mode === 'practice' &&
              config.parts &&
              config.parts.length > 0 &&
              config.parts.every((p) => p >= 5));

          if (STEP_ORDER[prevIdx] === 'SOUND_CHECK' && isReadingOnly) {
            prevIdx -= 1;
          }
          set({ currentStep: STEP_ORDER[Math.max(0, prevIdx)] });
        }
      },

      setMode: (mode: ExamMode) => {
        set((state) => {
          // Khi chọn mode mới, thiết lập options mặc định phù hợp
          let newOptions = { ...state.config.options };
          if (mode === 'full' || mode === 'skill') {
            newOptions = {
              timerEnabled: true,
              allowReplayAudio: false,
              showAnswerImmediately: false,
              shuffleQuestions: false,
            };
          } else if (mode === 'practice') {
            newOptions = {
              timerEnabled: true,
              allowReplayAudio: true,
              showAnswerImmediately: false,
              shuffleQuestions: false,
            };
          } else if (mode === 'review-wrong') {
            newOptions = {
              timerEnabled: true,
              allowReplayAudio: true,
              showAnswerImmediately: true,
              shuffleQuestions: false,
            };
          }

          return {
            config: {
              ...state.config,
              mode,
              options: newOptions,
            },
          };
        });
      },

      setTest: (testId: string, testTitle?: string) => {
        set((state) => ({
          config: {
            ...state.config,
            testId,
            testTitle: testTitle || state.config.testTitle,
          },
        }));
      },

      setSkill: (skill: 'listening' | 'reading') => {
        set((state) => ({
          config: {
            ...state.config,
            skill,
          },
        }));
      },

      setSkillChoice: (choice: 'LISTENING' | 'READING' | 'listening' | 'reading') => {
        const skill = choice.toLowerCase() as 'listening' | 'reading';
        get().setSkill(skill);
      },

      setParts: (parts: number[]) => {
        set((state) => ({
          config: {
            ...state.config,
            parts: parts.length > 0 ? parts : [5],
          },
        }));
      },

      togglePart: (partNum: number) => {
        set((state) => {
          const current = state.config.parts || [5];
          const exists = current.includes(partNum);
          const nextParts = exists
            ? current.filter((p) => p !== partNum)
            : [...current, partNum].sort((a, b) => a - b);

          return {
            config: {
              ...state.config,
              parts: nextParts.length > 0 ? nextParts : [partNum],
            },
          };
        });
      },

      togglePartSelection: (partNum: number) => {
        get().togglePart(partNum);
      },

      setOptions: (options: Partial<TestSessionConfig['options']>) => {
        set((state) => ({
          config: {
            ...state.config,
            options: {
              ...state.config.options,
              ...options,
            },
          },
        }));
      },

      setPracticeOptions: (options: Partial<TestSessionConfig['options']>) => {
        get().setOptions(options);
      },

      setCandidate: (candidateData: Partial<CandidateInfo>) => {
        set((state) => ({
          config: {
            ...state.config,
            candidate: {
              ...(state.config.candidate || DEFAULT_CANDIDATE),
              ...candidateData,
            },
          },
        }));
      },

      setCandidateInfo: (info: Partial<CandidateInfo>) => {
        get().setCandidate(info);
      },

      setConfig: (partial: Partial<TestSessionConfig>) => {
        set((state) => ({
          config: {
            ...state.config,
            ...partial,
          },
        }));
      },

      setMistakeAttemptId: (attemptId: string) => {
        set((state) => ({
          config: {
            ...state.config,
            mistakeSourceAttemptId: attemptId,
          },
        }));
      },

      setSoundVerified: (verified: boolean) => {
        set((state) => ({
          config: {
            ...state.config,
            isSoundVerified: verified,
          },
        }));
      },

      setTermsAccepted: (accepted: boolean) => {
        set((state) => ({
          config: {
            ...state.config,
            isTermsAccepted: accepted,
          },
        }));
      },

      resetSession: () => {
        set({
          currentStep: 'MODE_SELECT',
          config: {
            ...DEFAULT_CONFIG,
          },
        });
      },

      getRules: (): ExamRules => {
        return getExamRules(get().config);
      },

      buildActiveExamData: (baseExam: ExamData): ExamData => {
        const { config, getRules } = get();
        const rules = getRules();
        const mode = config.mode;

        // 1. CHẾ ĐỘ THI THỬ ĐẦY ĐỦ ('full')
        if (mode === 'full') {
          return {
            ...baseExam,
            test: {
              ...baseExam.test,
              duration_minutes: rules.durationMinutes,
            },
          };
        }

        // 2. CHẾ ĐỘ THI THEO KỸ NĂNG ('skill')
        if (mode === 'skill') {
          const isListening = config.skill === 'listening';
          const filteredQuestions = baseExam.questions.filter((q) =>
            isListening ? q.part_number <= 4 : q.part_number >= 5
          );
          const activePassageIds = new Set(
            filteredQuestions.map((q) => q.passage_id_ref).filter(Boolean)
          );
          const filteredPassages = baseExam.passages.filter((p) =>
            activePassageIds.has(p.id_ref)
          );
          const filteredParts = baseExam.parts.filter((pt) =>
            isListening ? pt.part_number <= 4 : pt.part_number >= 5
          );

          return {
            ...baseExam,
            test: {
              ...baseExam.test,
              title: `${baseExam.test.title} [${isListening ? 'Kỹ năng Listening' : 'Kỹ năng Reading'}]`,
              duration_minutes: rules.durationMinutes,
              total_questions: filteredQuestions.length,
            },
            parts: filteredParts,
            passages: filteredPassages,
            questions: filteredQuestions,
          };
        }

        // 3. CHẾ ĐỘ LUYỆN THEO PART ('practice')
        if (mode === 'practice') {
          const selectedParts = config.parts && config.parts.length > 0 ? config.parts : [5];
          let filteredQuestions = baseExam.questions.filter((q) =>
            selectedParts.includes(q.part_number)
          );

          // Xáo trộn câu hỏi nếu rules cho phép
          if (rules.shuffleQuestions) {
            filteredQuestions = [...filteredQuestions].sort(() => Math.random() - 0.5);
          }

          const activePassageIds = new Set(
            filteredQuestions.map((q) => q.passage_id_ref).filter(Boolean)
          );
          const filteredPassages = baseExam.passages.filter((p) =>
            activePassageIds.has(p.id_ref)
          );
          const filteredParts = baseExam.parts.filter((pt) =>
            selectedParts.includes(pt.part_number)
          );

          return {
            ...baseExam,
            test: {
              ...baseExam.test,
              title: `${baseExam.test.title} [Luyện Part: ${selectedParts.join(', ')}]`,
              duration_minutes: rules.timerEnabled ? rules.durationMinutes : 999,
              total_questions: filteredQuestions.length,
            },
            parts: filteredParts,
            passages: filteredPassages,
            questions: filteredQuestions,
          };
        }

        // 4. CHẾ ĐỘ ÔN LẠI CÂU SAI ('review-wrong')
        if (mode === 'review-wrong') {
          const attemptId = config.mistakeSourceAttemptId || '';
          const incorrectQuestions = attemptService.getIncorrectQuestions(
            attemptId,
            baseExam.questions
          );

          const questionsToUse =
            incorrectQuestions.length > 0 ? incorrectQuestions : baseExam.questions;
          const activePassageIds = new Set(
            questionsToUse.map((q) => q.passage_id_ref).filter(Boolean)
          );
          const filteredPassages = baseExam.passages.filter((p) =>
            activePassageIds.has(p.id_ref)
          );

          return {
            ...baseExam,
            test: {
              ...baseExam.test,
              title: `${baseExam.test.title} [Ôn tập ${questionsToUse.length} câu làm sai]`,
              duration_minutes: rules.timerEnabled ? Math.max(15, questionsToUse.length * 1) : 999,
              total_questions: questionsToUse.length,
            },
            passages: filteredPassages,
            questions: questionsToUse,
          };
        }

        return baseExam;
      },
    }),
    {
      name: 'toeic_cbt_session_config',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        config: state.config,
        currentStep: state.currentStep,
      }),
    }
  )
);
