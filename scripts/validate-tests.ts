import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Xác định đường dẫn thư mục gốc dự án
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Định mức số câu chuẩn format TOEIC IIG 200 câu
const TOEIC_PART_STANDARDS: Record<number, { minQ: number; maxQ: number; count: number; optionsCount: number }> = {
  1: { minQ: 1, maxQ: 6, count: 6, optionsCount: 4 },
  2: { minQ: 7, maxQ: 31, count: 25, optionsCount: 3 },
  3: { minQ: 32, maxQ: 70, count: 39, optionsCount: 4 },
  4: { minQ: 71, maxQ: 100, count: 30, optionsCount: 4 },
  5: { minQ: 101, maxQ: 130, count: 30, optionsCount: 4 },
  6: { minQ: 131, maxQ: 146, count: 16, optionsCount: 4 },
  7: { minQ: 147, maxQ: 200, count: 54, optionsCount: 4 },
};

// ==========================================
// 1. ZOD SCHEMAS
// ==========================================
const OptionSchema = z.object({
  key: z.enum(['A', 'B', 'C', 'D']),
  text: z.string(),
});

const QuestionSchema = z.object({
  number: z.number().int().min(1).max(200),
  text: z.string().nullable().optional(),
  options: z.array(OptionSchema).min(3).max(4),
  answer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const PassageSchema = z.object({
  id: z.string().optional(),
  audioFile: z.string().nullable().optional(),
  audioScript: z.string().nullable().optional(),
  imagePrompt: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  text: z.string().nullable().optional(),
  startTime: z.number().nullable().optional(),
  endTime: z.number().nullable().optional(),
  questions: z.array(QuestionSchema).min(1),
});

const PartSchema = z.object({
  part: z.number().int().min(1).max(7),
  passages: z.array(PassageSchema).min(1),
});

// Schema cho file chứa 1 Part hoặc trọn bộ đề (nhiều Part)
const RootTestSchema = z.union([
  // Dạng 1: File chứa 1 Part đơn lẻ
  z.object({
    part: z.number().int().min(1).max(7),
    passages: z.array(PassageSchema),
  }),
  // Dạng 2: File trọn vẹn danh sách parts
  z.object({
    id: z.string().optional(),
    title: z.string().optional(),
    code: z.string().optional(),
    parts: z.array(PartSchema),
  }),
  // Dạng 3: File chứa mảng passages phẳng có trường part bên trong
  z.object({
    id: z.string().optional(),
    title: z.string().optional(),
    passages: z.array(
      PassageSchema.extend({
        part: z.number().int().min(1).max(7).optional(),
      })
    ),
  }),
  // Dạng 4: Mảng các Parts trực tiếp
  z.array(PartSchema),
]);

// Kiểu dữ liệu lỗi
interface ValidationError {
  file: string;
  questionNumber?: number;
  part?: number;
  type: 'SCHEMA' | 'AUDIO_MISSING' | 'COUNT_MISMATCH' | 'NUMBERING' | 'OPTION_MISMATCH' | 'ANSWER_INVALID';
  message: string;
}

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================
function findAudioDirectories(): string[] {
  return [
    path.join(ROOT_DIR, 'public'),
    path.join(ROOT_DIR, 'client', 'public'),
    path.join(ROOT_DIR, 'public', 'audio'),
    path.join(ROOT_DIR, 'client', 'public', 'audio'),
  ];
}

function checkAudioExists(audioPath: string): boolean {
  // Bỏ qua link online (Supabase CDN, S3, Cloudinary...)
  if (audioPath.startsWith('http://') || audioPath.startsWith('https://')) {
    return true;
  }

  const cleanPath = audioPath.replace(/^\//, ''); // Bỏ dấu / ở đầu
  const audioDirs = findAudioDirectories();

  for (const baseDir of audioDirs) {
    const fullPath1 = path.join(baseDir, cleanPath);
    if (fs.existsSync(fullPath1)) return true;

    // Thử ghép thêm tiền tố audio/ nếu path chưa có
    const fullPath2 = path.join(baseDir, 'audio', cleanPath);
    if (fs.existsSync(fullPath2)) return true;
  }

  return false;
}

// Trích xuất toàn bộ câu hỏi và ánh xạ Part từ các format JSON khác nhau
function extractQuestionsAndParts(
  parsedData: unknown
): { partNumber: number; question: z.infer<typeof QuestionSchema>; audioFile?: string | null }[] {
  const extracted: { partNumber: number; question: z.infer<typeof QuestionSchema>; audioFile?: string | null }[] = [];

  // 1. Nếu là dạng { part: 1, passages: [...] }
  if (typeof parsedData === 'object' && parsedData !== null && 'part' in parsedData && 'passages' in parsedData) {
    const pData = parsedData as { part: number; passages: z.infer<typeof PassageSchema>[] };
    for (const passage of pData.passages) {
      for (const q of passage.questions) {
        extracted.push({ partNumber: pData.part, question: q, audioFile: passage.audioFile });
      }
    }
    return extracted;
  }

  // 2. Nếu là dạng { parts: [ { part: 1, passages: [...] } ] }
  if (typeof parsedData === 'object' && parsedData !== null && 'parts' in parsedData) {
    const pData = parsedData as { parts: { part: number; passages: z.infer<typeof PassageSchema>[] }[] };
    for (const part of pData.parts) {
      for (const passage of part.passages) {
        for (const q of passage.questions) {
          extracted.push({ partNumber: part.part, question: q, audioFile: passage.audioFile });
        }
      }
    }
    return extracted;
  }

  // 3. Nếu là dạng mảng [ { part: 1, passages: [...] } ]
  if (Array.isArray(parsedData)) {
    for (const part of parsedData) {
      if (typeof part === 'object' && part !== null && 'part' in part && 'passages' in part) {
        for (const passage of part.passages) {
          for (const q of passage.questions) {
            extracted.push({ partNumber: part.part, question: q, audioFile: passage.audioFile });
          }
        }
      }
    }
    return extracted;
  }

  // 4. Nếu là dạng { passages: [ { part?: 1, questions: [...] } ] }
  if (typeof parsedData === 'object' && parsedData !== null && 'passages' in parsedData) {
    const pData = parsedData as { passages: (z.infer<typeof PassageSchema> & { part?: number })[] };
    for (const passage of pData.passages) {
      // Ước lượng Part dựa vào số câu nếu không có passage.part
      for (const q of passage.questions) {
        let estimatedPart = passage.part || 1;
        if (!passage.part) {
          for (const [pNum, std] of Object.entries(TOEIC_PART_STANDARDS)) {
            if (q.number >= std.minQ && q.number <= std.maxQ) {
              estimatedPart = Number(pNum);
              break;
            }
          }
        }
        extracted.push({ partNumber: estimatedPart, question: q, audioFile: passage.audioFile });
      }
    }
    return extracted;
  }

  return extracted;
}

// ==========================================
// 3. CORE VALIDATION FUNCTION
// ==========================================
function validateTestFile(filePath: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const fileName = path.basename(filePath);

  let rawContent: string;
  try {
    rawContent = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    errors.push({
      file: fileName,
      type: 'SCHEMA',
      message: `Không thể đọc file: ${err instanceof Error ? err.message : String(err)}`,
    });
    return errors;
  }

  let jsonData: unknown;
  try {
    jsonData = JSON.parse(rawContent);
  } catch (err) {
    errors.push({
      file: fileName,
      type: 'SCHEMA',
      message: `File không đúng định dạng JSON: ${err instanceof Error ? err.message : String(err)}`,
    });
    return errors;
  }

  // Bước 1: Kiểm tra Zod Schema
  const schemaResult = RootTestSchema.safeParse(jsonData);
  if (!schemaResult.success) {
    for (const issue of schemaResult.error.issues) {
      errors.push({
        file: fileName,
        type: 'SCHEMA',
        message: `[Zod Error] Đường dẫn '${issue.path.join('.')}': ${issue.message}`,
      });
    }
  }

  // Bước 2: Trích xuất và kiểm tra logic chi tiết từng câu hỏi
  const questionItems = extractQuestionsAndParts(jsonData);
  if (questionItems.length === 0) {
    errors.push({
      file: fileName,
      type: 'SCHEMA',
      message: 'Không tìm thấy câu hỏi nào hợp lệ trong cấu trúc file.',
    });
    return errors;
  }

  const seenNumbers = new Set<number>();
  const partQuestionCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };

  for (const item of questionItems) {
    const { partNumber, question, audioFile } = item;
    const qNum = question.number;
    const std = TOEIC_PART_STANDARDS[partNumber];

    partQuestionCounts[partNumber] = (partQuestionCounts[partNumber] || 0) + 1;

    // 2.1 Kiểm tra trùng lặp số câu
    if (seenNumbers.has(qNum)) {
      errors.push({
        file: fileName,
        questionNumber: qNum,
        part: partNumber,
        type: 'NUMBERING',
        message: `Trùng lặp số câu #${qNum}! Câu hỏi này đã xuất hiện trước đó.`,
      });
    }
    seenNumbers.add(qNum);

    // 2.2 Kiểm tra số câu có nằm trong dải chuẩn của Part không
    if (std && (qNum < std.minQ || qNum > std.maxQ)) {
      errors.push({
        file: fileName,
        questionNumber: qNum,
        part: partNumber,
        type: 'NUMBERING',
        message: `Câu #${qNum} không nằm trong dải số câu chuẩn của Part ${partNumber} (${std.minQ} - ${std.maxQ}).`,
      });
    }

    // 2.3 Kiểm tra số lượng options (Part 2 đúng 3 options A-C, các Part khác đúng 4 options A-D)
    if (std) {
      if (question.options.length !== std.optionsCount) {
        errors.push({
          file: fileName,
          questionNumber: qNum,
          part: partNumber,
          type: 'OPTION_MISMATCH',
          message: `Part ${partNumber} yêu cầu đúng ${std.optionsCount} phương án, nhưng câu #${qNum} đang có ${question.options.length} phương án.`,
        });
      }

      // Kiểm tra Part 2 không được có phương án D
      if (partNumber === 2) {
        const hasOptionD = question.options.some((opt) => opt.key === 'D');
        if (hasOptionD) {
          errors.push({
            file: fileName,
            questionNumber: qNum,
            part: 2,
            type: 'OPTION_MISMATCH',
            message: `Part 2 chỉ cho phép 3 lựa chọn A, B, C; câu #${qNum} không được chứa phương án D.`,
          });
        }
      }
    }

    // 2.4 Kiểm tra đáp án đúng (answer) có nằm trong danh sách options không
    const availableKeys = question.options.map((opt) => opt.key);
    if (!availableKeys.includes(question.answer)) {
      errors.push({
        file: fileName,
        questionNumber: qNum,
        part: partNumber,
        type: 'ANSWER_INVALID',
        message: `Đáp án đúng '${question.answer}' của câu #${qNum} không tồn tại trong danh sách options [${availableKeys.join(', ')}].`,
      });
    }

    // 2.5 Kiểm tra file audio tồn tại (với các câu Listening Part 1-4)
    if (partNumber <= 4 && audioFile) {
      const exists = checkAudioExists(audioFile);
      if (!exists) {
        errors.push({
          file: fileName,
          questionNumber: qNum,
          part: partNumber,
          type: 'AUDIO_MISSING',
          message: `File âm thanh '${audioFile}' khai báo cho câu #${qNum} không tồn tại trong thư mục public/audio/.`,
        });
      }
    }
  }

  // Bước 3: Kiểm tra tính liên tục của dãy số câu
  const sortedNumbers = Array.from(seenNumbers).sort((a, b) => a - b);
  const minNum = sortedNumbers[0];
  const maxNum = sortedNumbers[sortedNumbers.length - 1];

  for (let i = minNum; i <= maxNum; i++) {
    if (!seenNumbers.has(i)) {
      errors.push({
        file: fileName,
        type: 'NUMBERING',
        message: `Thiếu câu #${i} trong chuỗi đánh số liên tục từ câu #${minNum} đến #${maxNum}.`,
      });
    }
  }

  // Bước 4: Kiểm tra định mức số câu cho bài thi FULL 200 câu
  if (sortedNumbers.length >= 100 || (minNum === 1 && maxNum === 200)) {
    for (let p = 1; p <= 7; p++) {
      const expected = TOEIC_PART_STANDARDS[p].count;
      const actual = partQuestionCounts[p] || 0;
      if (actual !== expected) {
        errors.push({
          file: fileName,
          part: p,
          type: 'COUNT_MISMATCH',
          message: `Part ${p} có ${actual} câu, không đúng chuẩn định mức ${expected} câu của đề 200 câu.`,
        });
      }
    }
  }

  return errors;
}

// ==========================================
// 4. MAIN RUNNER
// ==========================================
function main() {
  console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════════');
  console.log('\x1b[36m%s\x1b[0m', '  🔍 TOEIC CBT EXAM VALIDATOR - KIỂM THỬ ĐỀ THI BẰNG ZOD');
  console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════════\n');

  // Tìm các thư mục tests khả dĩ
  const possibleDirs = [
    path.join(ROOT_DIR, 'src', 'data', 'tests'),
    path.join(ROOT_DIR, 'client', 'src', 'data', 'tests'),
    path.join(ROOT_DIR, 'data', 'tests'),
    path.join(ROOT_DIR, 'client', 'src', 'data'),
    path.join(ROOT_DIR, 'data'),
  ];

  let targetDir = possibleDirs.find((dir) => fs.existsSync(dir));

  // Cho phép truyền thư mục qua tham số dòng lệnh
  if (process.argv[2]) {
    const customDir = path.resolve(process.cwd(), process.argv[2]);
    if (fs.existsSync(customDir)) {
      targetDir = customDir;
    }
  }

  if (!targetDir) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Không tìm thấy thư mục chứa file đề thi JSON (src/data/tests/)');
    process.exit(1);
  }

  console.log(`📁 Quét thư mục: \x1b[33m${path.relative(ROOT_DIR, targetDir) || targetDir}\x1b[0m\n`);

  const files = fs
    .readdirSync(targetDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(targetDir, f));

  if (files.length === 0) {
    console.log('\x1b[33m%s\x1b[0m', `⚠️ Không tìm thấy file .json nào trong thư mục: ${targetDir}`);
    process.exit(0);
  }

  let totalErrors = 0;
  let passedFiles = 0;
  let failedFiles = 0;

  for (const file of files) {
    const fileName = path.basename(file);
    console.log(`⚡ Đang kiểm tra: \x1b[1m${fileName}\x1b[0m...`);

    const fileErrors = validateTestFile(file);

    if (fileErrors.length === 0) {
      console.log(`  \x1b[32m✔ HỢP LỆ: 100% đúng chuẩn TOEIC CBT\x1b[0m\n`);
      passedFiles++;
    } else {
      console.log(`  \x1b[31m✖ PHÁT HIỆN ${fileErrors.length} LỖI:\x1b[0m`);
      for (const err of fileErrors) {
        const qPrefix = err.questionNumber ? `[Câu #${err.questionNumber}] ` : '';
        const pPrefix = err.part ? `[Part ${err.part}] ` : '';
        console.log(`    \x1b[31m•\x1b[0m ${qPrefix}${pPrefix}\x1b[33m[${err.type}]\x1b[0m ${err.message}`);
      }
      console.log('');
      totalErrors += fileErrors.length;
      failedFiles++;
    }
  }

  console.log('\x1b[36m%s\x1b[0m', '────────────────────────────────────────────────────────────────');
  console.log('\x1b[1mTỔNG KẾT KIỂM THỬ:\x1b[0m');
  console.log(`• Tổng số file đã quét: \x1b[1m${files.length}\x1b[0m`);
  console.log(`• File hợp lệ: \x1b[32m${passedFiles}\x1b[0m`);
  console.log(`• File có lỗi: \x1b[31m${failedFiles}\x1b[0m`);
  console.log(`• Tổng số lỗi phát hiện: \x1b[31m${totalErrors}\x1b[0m`);
  console.log('\x1b[36m%s\x1b[0m', '────────────────────────────────────────────────────────────────\n');

  if (totalErrors > 0) {
    process.exit(1);
  } else {
    console.log('\x1b[32m%s\x1b[0m', '🎉 TẤT CẢ FILE ĐỀ THI ĐÃ VƯỢT QUA KIỂM THỬ ZOD!');
    process.exit(0);
  }
}

main();
