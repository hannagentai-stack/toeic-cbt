/**
 * ==============================================================================
 * SCRIPT IMPORT ĐỀ THI TOEIC TỪ JSON / CSV VÀO POSTGRESQL
 * ==============================================================================
 * Sử dụng:
 *   1. Kiểm tra tính hợp lệ dữ liệu (Dry-run không cần DB):
 *      node import_test.js --file ../data/sample_mini_test.json --dry-run
 *
 *   2. Import thật vào Database:
 *      node import_test.js --file ../data/sample_mini_test.json
 *
 *   3. Ghi đè nếu đề đã tồn tại:
 *      node import_test.js --file ../data/sample_mini_test.json --overwrite
 *
 * Biến môi trường: DATABASE_URL (postgres://user:pass@localhost:5432/toeic_db)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Đọc tham số dòng lệnh
const args = process.argv.slice(2);
function getArg(flag) {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : null;
}
const hasFlag = (flag) => args.includes(flag);

const filePath = getArg('--file') || path.resolve(__dirname, '../data/sample_mini_test.json');
const isDryRun = hasFlag('--dry-run');
const isOverwrite = hasFlag('--overwrite');
const dbUrl = process.env.DATABASE_URL || getArg('--db');

/**
 * 1. Hàm kiểm tra tính toàn vẹn của dữ liệu đề thi (Validation)
 */
function validateExamData(examData) {
  const errors = [];
  const warnings = [];

  if (!examData.test || !examData.test.title || !examData.test.code) {
    errors.push('Thiếu thông tin test: title và code là bắt buộc.');
  }

  if (!Array.isArray(examData.questions) || examData.questions.length === 0) {
    errors.push('Danh sách questions trống hoặc không phải mảng.');
    return { isValid: false, errors, warnings };
  }

  const passageIds = new Set(
    (examData.passages || []).map((p) => p.id_ref).filter(Boolean)
  );

  const seenQuestionNumbers = new Set();

  examData.questions.forEach((q, idx) => {
    const qNum = q.question_number || idx + 1;
    if (seenQuestionNumbers.has(qNum)) {
      errors.push(`Trùng số thứ tự câu hỏi: Câu #${qNum}`);
    }
    seenQuestionNumbers.add(qNum);

    if (!q.part_number || q.part_number < 1 || q.part_number > 7) {
      errors.push(`Câu #${qNum}: part_number phải từ 1 đến 7.`);
    }

    // Kiểm tra liên kết passage cho Part 3, 4, 6, 7
    if ([3, 4, 6, 7].includes(q.part_number)) {
      if (q.passage_id_ref && !passageIds.has(q.passage_id_ref)) {
        errors.push(`Câu #${qNum}: passage_id_ref "${q.passage_id_ref}" không tồn tại trong danh sách passages.`);
      }
    }

    // Kiểm tra quy chuẩn đáp án Part 1 & 2
    if (q.part_number === 1) {
      if (!q.image_url) {
        warnings.push(`Câu #${qNum} (Part 1): Chưa có link ảnh minh họa (image_url).`);
      }
    }
    if (q.part_number === 2) {
      if (q.options && q.options.length > 3) {
        warnings.push(`Câu #${qNum} (Part 2): Part 2 chuẩn chỉ có 3 lựa chọn A, B, C (hiện có ${q.options.length}).`);
      }
    }

    // Kiểm tra đáp án đúng
    if (!['A', 'B', 'C', 'D'].includes(q.correct_option)) {
      errors.push(`Câu #${qNum}: correct_option "${q.correct_option}" không hợp lệ (phải là A, B, C, hoặc D).`);
    }

    // Kiểm tra danh sách lựa chọn
    if (!Array.isArray(q.options) || q.options.length === 0) {
      errors.push(`Câu #${qNum}: Thiếu danh sách lựa chọn options.`);
    } else {
      const correctOptions = q.options.filter((opt) => opt.is_correct);
      if (correctOptions.length !== 1) {
        errors.push(`Câu #${qNum}: Phải có chính xác 1 lựa chọn is_correct = true.`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 2. Phân tích file CSV câu hỏi (hỗ trợ RFC 4180: xuống dòng trong ngoặc kép, cột trống, escaping)
 */
function parseCSVRows(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField);
      currentField = '';
      if (currentRow.length > 0 && currentRow.some((f) => f.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((f) => f.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function parseQuestionsCSV(csvContent) {
  const rows = parseCSVRows(csvContent);
  if (rows.length < 2) throw new Error('File CSV không đủ dữ liệu.');

  const headers = rows[0].map((h) => h.trim());
  const questions = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] !== undefined ? values[idx].trim() : '';
    });

    const partNum = parseInt(row.part_number, 10);
    const qNum = parseInt(row.question_number, 10);
    const correctOpt = (row.correct_option || '').toUpperCase().trim();


    const options = [
      { option_label: 'A', option_text: row.option_a || '(A)', is_correct: correctOpt === 'A' },
      { option_label: 'B', option_text: row.option_b || '(B)', is_correct: correctOpt === 'B' },
      { option_label: 'C', option_text: row.option_c || '(C)', is_correct: correctOpt === 'C' },
    ];
    if (partNum !== 2 && row.option_d) {
      options.push({ option_label: 'D', option_text: row.option_d || '(D)', is_correct: correctOpt === 'D' });
    }

    questions.push({
      part_number: partNum,
      question_number: qNum,
      question_type: row.question_type || 'INCOMPLETE_SENTENCE',
      passage_id_ref: row.passage_ref || null,
      question_text: row.question_text || null,
      image_url: row.image_url || null,
      audio_url: row.audio_url || null,
      transcript: row.transcript || null,
      explanation: row.explanation || null,
      tags: row.tags ? row.tags.split(';').map((t) => t.trim()) : [],
      correct_option: correctOpt,
      options,
    });
  }

  return {
    test: {
      title: 'CSV Imported TOEIC Test',
      code: 'CSV_IMPORT_' + Date.now(),
      description: 'Đề thi được nhập từ file CSV',
      duration_minutes: 120,
      total_questions: questions.length,
      is_published: true,
    },
    parts: [
      { part_number: 1, name: 'Photographs', total_questions: 0 },
      { part_number: 2, name: 'Question-Response', total_questions: 0 },
      { part_number: 3, name: 'Conversations', total_questions: 0 },
      { part_number: 4, name: 'Short Talks', total_questions: 0 },
      { part_number: 5, name: 'Incomplete Sentences', total_questions: 0 },
      { part_number: 6, name: 'Text Completion', total_questions: 0 },
      { part_number: 7, name: 'Reading Comprehension', total_questions: 0 },
    ],
    passages: [],
    questions,
  };
}

/**
 * 3. Tiến trình Import vào PostgreSQL (Atomic Transaction)
 */
async function importToDatabase(examData, pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🔄 Đang bắt đầu transaction lưu vào PostgreSQL...');

    // Kiểm tra đề thi đã tồn tại chưa
    const checkTestRes = await client.query('SELECT id FROM tests WHERE code = $1', [examData.test.code]);
    if (checkTestRes.rows.length > 0) {
      if (!isOverwrite) {
        throw new Error(`Đề thi với mã code "${examData.test.code}" đã tồn tại! Dùng cờ --overwrite để ghi đè.`);
      }
      console.log(`⚠️ Đang xóa dữ liệu cũ của đề thi "${examData.test.code}" để ghi đè...`);
      await client.query('DELETE FROM tests WHERE code = $1', [examData.test.code]);
    }

    // 1. Thêm bản ghi TESTS
    const insertTestQuery = `
      INSERT INTO tests (title, code, description, duration_minutes, total_questions, full_audio_url, is_published)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `;
    const testResult = await client.query(insertTestQuery, [
      examData.test.title,
      examData.test.code,
      examData.test.description || null,
      examData.test.duration_minutes || 120,
      examData.test.total_questions || examData.questions.length,
      examData.test.full_audio_url || null,
      examData.test.is_published !== false,
    ]);
    const testId = testResult.rows[0].id;
    console.log(`✅ [1/5] Đã tạo Test: "${examData.test.title}" (ID: ${testId})`);

    // 2. Thêm bản ghi PARTS (Part 1 -> Part 7)
    const partIdMap = new Map(); // part_number -> part_id
    const partsToInsert = examData.parts && examData.parts.length > 0 ? examData.parts : [
      { part_number: 1, name: 'Photographs', total_questions: 6 },
      { part_number: 2, name: 'Question-Response', total_questions: 25 },
      { part_number: 3, name: 'Conversations', total_questions: 39 },
      { part_number: 4, name: 'Short Talks', total_questions: 30 },
      { part_number: 5, name: 'Incomplete Sentences', total_questions: 30 },
      { part_number: 6, name: 'Text Completion', total_questions: 16 },
      { part_number: 7, name: 'Reading Comprehension', total_questions: 54 },
    ];

    for (const p of partsToInsert) {
      const partRes = await client.query(
        `INSERT INTO parts (test_id, part_number, name, directions_text, directions_audio_url, total_questions)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id;`,
        [
          testId,
          p.part_number,
          p.name,
          p.directions_text || null,
          p.directions_audio_url || null,
          p.total_questions || 0,
        ]
      );
      partIdMap.set(p.part_number, partRes.rows[0].id);
    }
    console.log(`✅ [2/5] Đã khởi tạo 7 Part của bài thi.`);

    // 3. Thêm bản ghi PASSAGES
    const passageIdMap = new Map(); // id_ref -> passage_id
    if (examData.passages && examData.passages.length > 0) {
      for (const pass of examData.passages) {
        const passRes = await client.query(
          `INSERT INTO passages (test_id, part_number, title, content, audio_url, image_url, order_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id;`,
          [
            testId,
            pass.part_number,
            pass.title || null,
            pass.content || null,
            pass.audio_url || null,
            pass.image_url || null,
            pass.order_index || 1,
          ]
        );
        if (pass.id_ref) {
          passageIdMap.set(pass.id_ref, passRes.rows[0].id);
        }
      }
      console.log(`✅ [3/5] Đã nhập ${examData.passages.length} nhóm bài đọc / đoạn hội thoại (Passages).`);
    }

    // 4 & 5. Thêm QUESTIONS và OPTIONS
    let questionsCount = 0;
    let optionsCount = 0;

    for (const q of examData.questions) {
      const partId = partIdMap.get(q.part_number);
      const passageId = q.passage_id_ref ? passageIdMap.get(q.passage_id_ref) || null : null;

      const qRes = await client.query(
        `INSERT INTO questions (
          test_id, part_id, passage_id, part_number, question_number,
          question_type, question_text, audio_url, image_url, audio_timestamp,
          transcript, vietnamese_translation, explanation, tags, correct_option
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id;`,
        [
          testId,
          partId,
          passageId,
          q.part_number,
          q.question_number,
          q.question_type,
          q.question_text || null,
          q.audio_url || null,
          q.image_url || null,
          q.audio_timestamp || null,
          q.transcript || null,
          q.vietnamese_translation || null,
          q.explanation || null,
          JSON.stringify(q.tags || []),
          q.correct_option,
        ]
      );
      const questionId = qRes.rows[0].id;
      questionsCount++;

      // Chèn các lựa chọn A, B, C, D
      for (let i = 0; i < q.options.length; i++) {
        const opt = q.options[i];
        await client.query(
          `INSERT INTO options (question_id, option_label, option_text, is_correct, order_index)
           VALUES ($1, $2, $3, $4, $5);`,
          [
            questionId,
            opt.option_label,
            opt.option_text || `(${opt.option_label})`,
            Boolean(opt.is_correct),
            i + 1,
          ]
        );
        optionsCount++;
      }
    }

    console.log(`✅ [4/5] Đã lưu ${questionsCount} câu hỏi.`);
    console.log(`✅ [5/5] Đã lưu ${optionsCount} phương án trả lời.`);

    await client.query('COMMIT');
    console.log(`🎉 HOÀN TẤT! Đề thi "${examData.test.title}" đã được import thành công vào DB.`);
    return { success: true, testId, questionsCount, optionsCount };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Lỗi khi import, đã ROLLBACK toàn bộ transaction:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * 4. Hàm main điều phối
 */
async function main() {
  console.log('====================================================');
  console.log('🚀 TOEIC BANK IMPORTER (IIG Standard Format)');
  console.log('====================================================');
  console.log(`📂 Nguồn dữ liệu: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Không tìm thấy file: ${filePath}`);
    process.exit(1);
  }

  const rawFile = fs.readFileSync(filePath, 'utf-8');
  let examData;

  if (filePath.endsWith('.json')) {
    examData = JSON.parse(rawFile);
  } else if (filePath.endsWith('.csv')) {
    examData = parseQuestionsCSV(rawFile);
  } else {
    console.error('❌ Định dạng file không hỗ trợ! Vui lòng dùng .json hoặc .csv.');
    process.exit(1);
  }

  // Bước 1: Kiểm tra tính hợp lệ dữ liệu
  console.log('\n🔍 Đang kiểm tra cấu trúc dữ liệu...');
  const validation = validateExamData(examData);

  if (validation.warnings.length > 0) {
    console.log('\n⚠️ CẢNH BÁO:');
    validation.warnings.forEach((w) => console.log('  - ' + w));
  }

  if (!validation.isValid) {
    console.log('\n❌ LỖI DỮ LIỆU:');
    validation.errors.forEach((e) => console.log('  - ' + e));
    process.exit(1);
  }

  console.log('✨ Dữ liệu hoàn toàn hợp lệ!');
  console.log(`📊 Tổng quan:`);
  console.log(`  • Tên đề: ${examData.test.title} (${examData.test.code})`);
  console.log(`  • Thời gian: ${examData.test.duration_minutes} phút`);
  console.log(`  • Số câu hỏi: ${examData.questions.length} câu`);
  console.log(`  • Số nhóm bài đọc/hội thoại (Passages): ${(examData.passages || []).length} nhóm`);

  // Thống kê số câu theo từng Part
  const partStats = {};
  examData.questions.forEach((q) => {
    partStats[q.part_number] = (partStats[q.part_number] || 0) + 1;
  });
  console.log('  • Phân bổ theo Part:');
  for (let p = 1; p <= 7; p++) {
    console.log(`     - Part ${p}: ${partStats[p] || 0} câu`);
  }

  // Bước 2: Chế độ Dry-Run
  if (isDryRun) {
    console.log('\n💡 [DRY-RUN THÀNH CÔNG]: Cấu trúc đề thi hoàn toàn hợp lệ!');
    console.log('   Bạn có thể sẵn sàng import vào cơ sở dữ liệu PostgreSQL.');
    process.exit(0);
  }

  // Bước 3: Nạp dotenv & pg khi thực sự cần kết nối DB
  try {
    const dotenv = await import('dotenv');
    dotenv.default.config({ path: path.resolve(__dirname, '../.env') });
    dotenv.default.config();
  } catch (e) {
    // Không bắt buộc nếu môi trường đã có process.env
  }

  const effectiveDbUrl = process.env.DATABASE_URL || getArg('--db');

  if (!effectiveDbUrl) {
    console.log('\nℹ️ Chưa cấu hình DATABASE_URL.');
    console.log('  1. Dùng --dry-run để kiểm tra cấu trúc dữ liệu không cần DB.');
    console.log('  2. Cung cấp DATABASE_URL trong file .env hoặc qua tham số --db <url>');
    process.exit(0);
  }

  let pg;
  try {
    pg = await import('pg');
  } catch (e) {
    console.error('❌ Thư viện "pg" chưa được cài đặt. Vui lòng chạy: cd scripts && npm install');
    process.exit(1);
  }

  const pool = new pg.default.Pool({ connectionString: effectiveDbUrl });
  try {
    await importToDatabase(examData, pool);
  } catch (error) {
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Lỗi nghiêm trọng:', err);
  process.exit(1);
});
