import type { ExamData, OptionLabel } from '../types/exam';

export interface PartStat {
  part_number: number;
  part_name: string;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  accuracy: number; // Tỷ lệ % đúng (0 - 100)
}

export interface ExamScoreResult {
  listeningRawScore: number;       // Số câu nghe đúng thực tế
  listeningTotalQuestions: number;  // Tổng số câu nghe trong đề
  listeningScaledScore: number;     // Quy đổi thang điểm 5 - 495
  
  readingRawScore: number;         // Số câu đọc đúng thực tế
  readingTotalQuestions: number;    // Tổng số câu đọc trong đề
  readingScaledScore: number;       // Quy đổi thang điểm 5 - 495
  
  totalScore: number;              // Tổng điểm TOEIC (10 - 990)
  totalCorrect: number;
  totalQuestions: number;
  overallAccuracy: number;         // % tổng thể
  
  durationSeconds: number;         // Tổng thời gian làm bài (giây)
  avgSecondsPerQuestion: number;   // Thời gian trung bình mỗi câu
  
  partStats: PartStat[];           // Thống kê chi tiết 7 Part
  weaknesses: string[];            // Danh sách điểm yếu cần khắc phục
  recommendations: string[];       // Lời khuyên ôn luyện cụ thể
}

/**
 * BẢNG QUY ĐỔI ĐIỂM TOEIC CHUẨN ETS (0 - 100 CÂU ĐÚNG ➔ 5 - 495 ĐIỂM)
 * Lưu ý: Thang điểm là bảng tra ước lượng theo chuẩn độ khó trung bình ETS.
 */
const ETS_SCORE_TABLE: Record<number, { listening: number; reading: number }> = {
  0: { listening: 5, reading: 5 },
  1: { listening: 5, reading: 5 },
  2: { listening: 5, reading: 5 },
  3: { listening: 5, reading: 5 },
  4: { listening: 5, reading: 5 },
  5: { listening: 5, reading: 5 },
  6: { listening: 10, reading: 5 },
  7: { listening: 15, reading: 5 },
  8: { listening: 20, reading: 5 },
  9: { listening: 25, reading: 5 },
  10: { listening: 30, reading: 10 },
  15: { listening: 55, reading: 35 },
  20: { listening: 80, reading: 60 },
  25: { listening: 110, reading: 85 },
  30: { listening: 135, reading: 110 },
  35: { listening: 165, reading: 135 },
  40: { listening: 190, reading: 160 },
  45: { listening: 220, reading: 185 },
  50: { listening: 250, reading: 210 },
  55: { listening: 280, reading: 235 },
  60: { listening: 315, reading: 260 },
  65: { listening: 345, reading: 285 },
  70: { listening: 380, reading: 310 },
  75: { listening: 405, reading: 335 },
  80: { listening: 440, reading: 360 },
  85: { listening: 470, reading: 385 },
  90: { listening: 495, reading: 410 },
  95: { listening: 495, reading: 435 },
  98: { listening: 495, reading: 465 },
  99: { listening: 495, reading: 480 },
  100: { listening: 495, reading: 495 },
};

/**
 * Quy đổi từ số câu đúng (quy về hệ 100) sang điểm scaled ETS (5 - 495)
 */
export function convertRawToScaledScore(
  rawCorrect: number,
  totalInTest: number,
  section: 'listening' | 'reading'
): number {
  if (totalInTest === 0 || rawCorrect <= 0) return 5;

  // Chuẩn hóa về thang 100 câu nếu là đề mini (ví dụ 7 câu Listening -> nhân hệ số 100/7)
  const normalizedRaw = Math.round((rawCorrect / totalInTest) * 100);
  const clampedRaw = Math.max(0, Math.min(100, normalizedRaw));

  // Tra cứu bảng ETS nếu có mốc chính xác
  if (ETS_SCORE_TABLE[clampedRaw]) {
    return ETS_SCORE_TABLE[clampedRaw][section];
  }

  // Nội suy tuyến tính gần đúng nếu không có mốc sẵn
  const keys = Object.keys(ETS_SCORE_TABLE).map(Number).sort((a, b) => a - b);
  let lowerKey = 0;
  let upperKey = 100;

  for (let i = 0; i < keys.length; i++) {
    if (keys[i] <= clampedRaw) lowerKey = keys[i];
    if (keys[i] >= clampedRaw) {
      upperKey = keys[i];
      break;
    }
  }

  if (lowerKey === upperKey) {
    return ETS_SCORE_TABLE[lowerKey][section];
  }

  const lowerScore = ETS_SCORE_TABLE[lowerKey][section];
  const upperScore = ETS_SCORE_TABLE[upperKey][section];
  const ratio = (clampedRaw - lowerKey) / (upperKey - lowerKey);
  const interpolated = lowerScore + ratio * (upperScore - lowerScore);

  // Làm tròn về bội số của 5 (quy chuẩn thang điểm TOEIC luôn chia hết cho 5)
  return Math.round(interpolated / 5) * 5;
}

/**
 * Tên chuẩn của từng Part
 */
const PART_NAMES: Record<number, string> = {
  1: 'Part 1: Photographs',
  2: 'Part 2: Question-Response',
  3: 'Part 3: Conversations',
  4: 'Part 4: Short Talks',
  5: 'Part 5: Incomplete Sentences',
  6: 'Part 6: Text Completion',
  7: 'Part 7: Reading Comprehension',
};

/**
 * Tính toán toàn bộ kết quả bài thi từ answers của thí sinh
 */
export function calculateExamResult(
  examData: ExamData,
  listeningAnswers: Record<number, OptionLabel>,
  readingAnswers: Record<number, OptionLabel>,
  durationSeconds: number
): ExamScoreResult {
  const allAnswers = { ...listeningAnswers, ...readingAnswers };

  let listeningRawScore = 0;
  let listeningTotalQuestions = 0;

  let readingRawScore = 0;
  let readingTotalQuestions = 0;

  const partMap: Record<number, { correct: number; incorrect: number; unanswered: number; total: number }> = {
    1: { correct: 0, incorrect: 0, unanswered: 0, total: 0 },
    2: { correct: 0, incorrect: 0, unanswered: 0, total: 0 },
    3: { correct: 0, incorrect: 0, unanswered: 0, total: 0 },
    4: { correct: 0, incorrect: 0, unanswered: 0, total: 0 },
    5: { correct: 0, incorrect: 0, unanswered: 0, total: 0 },
    6: { correct: 0, incorrect: 0, unanswered: 0, total: 0 },
    7: { correct: 0, incorrect: 0, unanswered: 0, total: 0 },
  };

  examData.questions.forEach((q) => {
    const isListening = q.part_number <= 4;
    if (isListening) {
      listeningTotalQuestions++;
    } else {
      readingTotalQuestions++;
    }

    const chosen = allAnswers[q.question_number];
    const isAnswered = chosen !== undefined;
    const isCorrect = isAnswered && chosen === q.correct_option;

    if (!partMap[q.part_number]) {
      partMap[q.part_number] = { correct: 0, incorrect: 0, unanswered: 0, total: 0 };
    }
    partMap[q.part_number].total++;

    if (!isAnswered) {
      partMap[q.part_number].unanswered++;
    } else if (isCorrect) {
      partMap[q.part_number].correct++;
      if (isListening) listeningRawScore++;
      else readingRawScore++;
    } else {
      partMap[q.part_number].incorrect++;
    }
  });

  // Quy đổi điểm scaled
  const listeningScaledScore = convertRawToScaledScore(
    listeningRawScore,
    listeningTotalQuestions,
    'listening'
  );
  const readingScaledScore = convertRawToScaledScore(
    readingRawScore,
    readingTotalQuestions,
    'reading'
  );
  const totalScore = listeningScaledScore + readingScaledScore;

  const totalQuestions = examData.questions.length;
  const totalCorrect = listeningRawScore + readingRawScore;
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const avgSecondsPerQuestion = totalQuestions > 0 ? Math.round(durationSeconds / totalQuestions) : 0;

  // Thống kê từng Part
  const partStats: PartStat[] = Object.keys(partMap).map((partNumStr) => {
    const pNum = Number(partNumStr);
    const data = partMap[pNum];
    const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;

    return {
      part_number: pNum,
      part_name: PART_NAMES[pNum] || `Part ${pNum}`,
      total_questions: data.total,
      correct_count: data.correct,
      incorrect_count: data.incorrect,
      unanswered_count: data.unanswered,
      accuracy,
    };
  });

  // Chuẩn đoán điểm yếu & gợi ý luyện tập thông minh
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  partStats.forEach((p) => {
    if (p.total_questions > 0 && p.accuracy < 60) {
      if (p.part_number === 1) {
        weaknesses.push('Part 1: Dễ bị bẫy động từ thì hiện tại tiếp diễn hoặc chi tiết nhỏ trong bức ảnh.');
        recommendations.push('Ôn luyện Part 1: Chú ý quan sát hành động người (chủ thể) và vị trí vật trước khi nghe.');
      } else if (p.part_number === 2) {
        weaknesses.push('Part 2: Phản xạ câu hỏi Wh-question và câu hỏi gián tiếp/bẫy đồng âm còn yếu.');
        recommendations.push('Ôn luyện Part 2: Nghe kỹ từ để hỏi đầu tiên (Where, When, Who...) và loại bỏ các đáp án lặp từ.');
      } else if (p.part_number === 3) {
        weaknesses.push('Part 3: Tốc độ đọc câu hỏi trước khi nghe chưa kịp nhịp hội thoại.');
        recommendations.push('Ôn luyện Part 3: Tận dụng thời gian đọc trước câu hỏi & đáp án, tập trung nghe người nói thứ 2.');
      } else if (p.part_number === 4) {
        weaknesses.push('Part 4: Chưa bắt kịp thông tin chính trong bài phát thanh hoặc thông báo.');
        recommendations.push('Ôn luyện Part 4: Chú ý 1-2 câu đầu để xác định bối cảnh địa điểm và người phát biểu.');
      } else if (p.part_number === 5) {
        weaknesses.push('Part 5: Mất điểm ở các câu ngữ pháp thì, từ loại hoặc giới từ.');
        recommendations.push('Ôn luyện Part 5: Rèn luyện kỹ thuật xác định thành phần câu (S + V + O) để điền từ trong 15-20s.');
      } else if (p.part_number === 6) {
        weaknesses.push('Part 6: Chưa bắt trọn mạch liên kết đoạn văn và câu điền cả câu.');
        recommendations.push('Ôn luyện Part 6: Đọc câu liền trước và liền sau chỗ trống để hiểu ngữ cảnh logic.');
      } else if (p.part_number === 7) {
        weaknesses.push('Part 7: Tốc độ đọc chưa đủ nhanh, dễ bị thiếu thời gian ở các đoạn kép/ba.');
        recommendations.push('Ôn luyện Part 7: Rèn luyện kỹ năng Skimming & Scanning, dùng tính năng highlight từ khóa quan trọng.');
      }
    }
  });

  if (weaknesses.length === 0) {
    weaknesses.push('Phong độ rất đồng đều giữa các Part!');
    recommendations.push('Tiếp tục duy trì luyện tập các đề full test để rèn luyện sức bền phòng thi 2 tiếng.');
  }

  return {
    listeningRawScore,
    listeningTotalQuestions,
    listeningScaledScore,
    readingRawScore,
    readingTotalQuestions,
    readingScaledScore,
    totalScore,
    totalCorrect,
    totalQuestions,
    overallAccuracy,
    durationSeconds,
    avgSecondsPerQuestion,
    partStats,
    weaknesses,
    recommendations,
  };
}
