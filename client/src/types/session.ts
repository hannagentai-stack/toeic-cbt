export type ExamMode = 'full' | 'skill' | 'practice' | 'review-wrong';

export interface CandidateInfo {
  fullName: string;
  dateOfBirth: string;
  candidateId: string;
  email?: string;
  targetScore?: number;
}

export interface SessionOptions {
  timerEnabled: boolean;                 // mặc định true; luyện tập cho phép tắt
  allowReplayAudio: boolean;             // luyện tập: true; thi thật: false
  showAnswerImmediately: boolean;        // luyện tập: tùy chọn; thi thật: false
  shuffleQuestions: boolean;             // chỉ luyện Part 5, tắt ở thi thật
  customMinutes?: number;                // số phút tự đặt (luyện tập)
}

export interface TestSessionConfig {
  mode: ExamMode;
  testId: string;
  testTitle?: string;
  skill?: 'listening' | 'reading';        // dùng cho mode 'skill'
  parts?: number[];                        // dùng cho mode 'practice', ví dụ [1,2,5]
  options: SessionOptions;
  candidate?: CandidateInfo;
  mistakeSourceAttemptId?: string;       // dùng cho mode 'review-wrong'
  isSoundVerified?: boolean;
  isTermsAccepted?: boolean;
}

export type PrepStep = 
  | 'MODE_SELECT'
  | 'TEST_SELECT'
  | 'OPTIONS'
  | 'CANDIDATE_INFO'
  | 'SOUND_CHECK'
  | 'INSTRUCTIONS';

/**
 * Các quy tắc áp dụng thực tế cho phòng thi (đã tính toán qua getExamRules)
 */
export interface ExamRules {
  isRealExam: boolean;                     // true nếu là 'full' hoặc 'skill'
  timerEnabled: boolean;                   // Bắt buộc true ở thi thật; practice theo options
  durationMinutes: number;                 // Số phút thi thực tế
  durationSeconds: number;                 // Số giây thi thực tế
  allowReplayAudio: boolean;               // Bắt buộc false ở thi thật; practice theo options
  lockAudioControls: boolean;              // Bắt buộc true ở thi thật (khóa thanh tua, phát 1 lần)
  showAnswerImmediately: boolean;          // Bắt buộc false ở thi thật; practice theo options
  allowGoBack: boolean;                    // Khóa quay lại: Listening thi thật không được quay lại câu đã qua
  allowGoBackInListening: boolean;         // Khóa quay lại câu nghe trong thi thật
  allowGoBackInReading: boolean;           // Reading luôn cho phép quay lại
  allowQuestionPaletteJump: boolean;       // Cho phép bấm nhảy câu tự do trên bảng palette
  shuffleQuestions: boolean;               // Bắt buộc false ở thi thật; chỉ cho phép khi luyện duy nhất Part 5
  allowPauseTimer: boolean;                // Bắt buộc false ở thi thật; practice cho phép tạm dừng
  canReviewDuringExam: boolean;            // Không cho xem giải thích giữa bài thi thật
}

/**
 * Trả về các quy tắc áp dụng thực tế của bài thi dựa trên config.
 * NGUYÊN TẮC QUAN TRỌNG:
 * Chế độ thi thật ('full' | 'skill') luôn GHI ĐÈ mọi tùy chọn:
 * - Không cho phép nghe lại audio (allowReplayAudio = false, lockAudioControls = true)
 * - Không cho xem đáp án ngay (showAnswerImmediately = false)
 * - Luôn bật đồng hồ đếm ngược (timerEnabled = true)
 * - Không xáo trộn thứ tự đề thi chuẩn (shuffleQuestions = false)
 * - Không cho tạm dừng thời gian (allowPauseTimer = false)
 * - Khóa quay lại với phần Listening (allowGoBackInListening = false)
 */
export function getExamRules(config: TestSessionConfig): ExamRules {
  const isRealExam = config.mode === 'full' || config.mode === 'skill';

  if (isRealExam) {
    const isListeningSkill = config.mode === 'skill' && config.skill === 'listening';
    const isReadingSkill = config.mode === 'skill' && config.skill === 'reading';

    let durationMinutes = 120; // Thi full 120 phút
    if (isListeningSkill) {
      durationMinutes = 45;    // Listening đơn lẻ 45 phút
    } else if (isReadingSkill) {
      durationMinutes = 75;    // Reading đơn lẻ 75 phút
    }

    return {
      isRealExam: true,
      timerEnabled: true,                      // GHI ĐÈ: Không được tắt đồng hồ
      durationMinutes,
      durationSeconds: durationMinutes * 60,
      allowReplayAudio: false,                 // GHI ĐÈ: Không được nghe lại audio
      lockAudioControls: true,                 // GHI ĐÈ: Khóa thanh điều khiển audio
      showAnswerImmediately: false,            // GHI ĐÈ: Không được xem đáp án ngay
      allowGoBack: true,                       // Tổng thể
      allowGoBackInListening: false,           // GHI ĐÈ: Khóa quay lại câu nghe khi đã chuyển câu
      allowGoBackInReading: true,              // Reading được di chuyển tự do giữa các câu
      allowQuestionPaletteJump: true,          // Bảng câu hỏi cho Reading
      shuffleQuestions: false,                 // GHI ĐÈ: Giữ đúng thứ tự câu ETS
      allowPauseTimer: false,                  // GHI ĐÈ: Không cho tạm dừng thi thật
      canReviewDuringExam: false,              // GHI ĐÈ: Không xem giải thích lúc làm bài
    };
  }

  // Chế độ Luyện tập ('practice') hoặc Ôn lại câu sai ('review-wrong')
  const selectedParts = config.parts && config.parts.length > 0 ? config.parts : [5];
  // Chỉ cho phép xáo trộn câu nếu CHỈ chọn duy nhất Part 5
  const isOnlyPart5 = selectedParts.length === 1 && selectedParts[0] === 5;
  const canShuffle = Boolean(config.options?.shuffleQuestions && isOnlyPart5);

  // Thời gian chuẩn ETS theo từng Part (phút)
  const partDurationTable: Record<number, number> = {
    1: 6,
    2: 12,
    3: 15,
    4: 12,
    5: 15,
    6: 10,
    7: 50,
  };
  const standardDuration = selectedParts.reduce((sum, p) => sum + (partDurationTable[p] || 10), 0);
  const durationMinutes =
    config.options?.customMinutes && config.options.customMinutes > 0
      ? config.options.customMinutes
      : standardDuration;

  const timerEnabled = config.options ? Boolean(config.options.timerEnabled) : true;
  const allowReplayAudio = config.options ? Boolean(config.options.allowReplayAudio) : true;
  const showAnswerImmediately = config.options ? Boolean(config.options.showAnswerImmediately) : false;

  return {
    isRealExam: false,
    timerEnabled,
    durationMinutes,
    durationSeconds: durationMinutes * 60,
    allowReplayAudio,
    lockAudioControls: !allowReplayAudio,
    showAnswerImmediately,
    allowGoBack: true,
    allowGoBackInListening: true,              // Luyện tập: Cho phép nghe lại và xem lại câu trước
    allowGoBackInReading: true,
    allowQuestionPaletteJump: true,
    shuffleQuestions: canShuffle,
    allowPauseTimer: true,                     // Luyện tập: Cho phép tạm dừng
    canReviewDuringExam: showAnswerImmediately,
  };
}
