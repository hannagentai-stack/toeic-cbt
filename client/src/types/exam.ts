export type OptionLabel = 'A' | 'B' | 'C' | 'D';

export type QuestionType =
  | 'PHOTO'
  | 'QUESTION_RESPONSE'
  | 'CONVERSATION'
  | 'SHORT_TALK'
  | 'INCOMPLETE_SENTENCE'
  | 'TEXT_COMPLETION'
  | 'READING_COMPREHENSION';

export interface Option {
  option_label: OptionLabel;
  option_text: string;
  is_correct?: boolean;
}

export interface Question {
  id?: string;
  part_number: number;
  question_number: number;
  question_type: QuestionType;
  passage_id_ref?: string | null;
  question_text?: string | null;
  audio_url?: string | null;
  image_url?: string | null;
  audio_timestamp?: number | null;
  silence_after_seconds?: number; // Thời gian im lặng chờ tô đáp án (mặc định 8s cho P1-P2, 10s cho P3-P4)
  transcript?: string | null;
  vietnamese_translation?: string | null;
  explanation?: string | null;
  tags?: string[];
  correct_option: OptionLabel;
  options: Option[];
}

export interface Passage {
  id_ref: string;
  part_number: number;
  title?: string | null;
  content?: string | null;
  audio_url?: string | null;
  image_url?: string | null;
  order_index?: number;
}

export interface PartInfo {
  part_number: number;
  name: string;
  directions_text: string;
  directions_audio_url?: string | null;
  total_questions: number;
}

export interface ExamData {
  test: {
    id?: string;
    title: string;
    code: string;
    description?: string;
    duration_minutes: number;
    total_questions: number;
    full_audio_url?: string | null;
    is_published?: boolean;
  };
  parts: PartInfo[];
  passages: Passage[];
  questions: Question[];
}

export type ListeningPhase =
  | 'DIRECTIONS'       // Màn hình hướng dẫn
  | 'PRELOADING'       // Đang nạp trước file audio
  | 'PLAYING'          // Đang phát audio câu hỏi
  | 'SILENCE_COUNTDOWN'// Khoảng lặng chờ thí sinh chọn đáp án trước khi khóa
  | 'COMPLETED_PART'   // Đã xong 1 Part, chuẩn bị sang Part tiếp
  | 'COMPLETED_ALL';   // Đã xong toàn bộ 100 câu Listening

export type Part5ViewMode = 'SINGLE' | 'LIST';

export interface PassageDocument {
  id: string;
  title: string;
  type?: 'email' | 'article' | 'notice' | 'chat' | 'advertisement' | 'schedule';
  content: string;
}

export * from './session';
