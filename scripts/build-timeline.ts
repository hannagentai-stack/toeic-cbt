import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// ==============================================================================
// CẤU HÌNH KHOẢNG IM LẶNG CHỜ TÔ ĐÁP ÁN (THEO CHUẨN ĐỀ THI THẬT)
// ==============================================================================
const SILENCE_CONFIG = {
  PART_1_SECONDS: 5, // Part 1: 5 giây im lặng giữa các câu
  PART_2_SECONDS: 5, // Part 2: 5 giây im lặng giữa các câu
  PART_3_SECONDS_PER_QUESTION: 8, // Part 3: 8 giây chờ cho mỗi câu hỏi con
  PART_4_SECONDS_PER_QUESTION: 8, // Part 4: 8 giây chờ cho mỗi câu hỏi con
};

// ==============================================================================
// 1. KIỂM TRA VÀ ĐỌC ĐỘ DÀI FILE MP3 (DÙNG FFPROBE KÈM FALLBACK TỰ ĐỘNG)
// ==============================================================================
let isFfprobeAvailable: boolean | null = null;

function checkFfprobe(): boolean {
  if (isFfprobeAvailable !== null) return isFfprobeAvailable;
  try {
    const res = spawnSync('ffprobe', ['-version'], { stdio: 'ignore' });
    isFfprobeAvailable = res.status === 0;
  } catch {
    isFfprobeAvailable = false;
  }
  return isFfprobeAvailable;
}

/**
 * Đọc độ dài file âm thanh tính bằng giây (Float)
 * Ưu tiên ffprobe, tự động fallback nếu chưa cài ffmpeg
 */
function getAudioDurationInSeconds(filePath: string, fallbackScript?: string | null): number {
  if (!fs.existsSync(filePath)) {
    // Nếu file chưa tồn tại trên ổ đĩa, ước tính dựa vào audioScript (tốc độ đọc TOEIC ~130 từ/phút)
    if (fallbackScript) {
      const words = fallbackScript.trim().split(/\s+/).length;
      return Math.max(3.0, parseFloat(((words / 130) * 60 + 1.2).toFixed(2)));
    }
    return 10.0;
  }

  // 1. Thử dùng ffprobe nếu có sẵn trên hệ thống
  if (checkFfprobe()) {
    try {
      const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
      const output = execSync(cmd, { encoding: 'utf-8' }).trim();
      const parsedDuration = parseFloat(output);
      if (!isNaN(parsedDuration) && parsedDuration > 0) {
        return parseFloat(parsedDuration.toFixed(2));
      }
    } catch {
      // Tiếp tục xuống fallback
    }
  }

  // 2. Fallback: Đọc độ dài MP3 Header hoặc ước tính theo dung lượng file
  try {
    const stats = fs.statSync(filePath);
    // Nếu là file mock/placeholder rất nhỏ (< 500 bytes)
    if (stats.size < 500 && fallbackScript) {
      const words = fallbackScript.trim().split(/\s+/).length;
      return Math.max(3.0, parseFloat(((words / 130) * 60 + 1.5).toFixed(2)));
    }

    // Giả định chuẩn bitrate 128 kbps (16,000 bytes/giây) cho file MP3 thực tế
    const estimatedSeconds = stats.size / 16000;
    if (estimatedSeconds >= 1.0) {
      return parseFloat(estimatedSeconds.toFixed(2));
    }
  } catch {
    // Bỏ qua
  }

  // 3. Fallback cuối cùng theo audioScript
  if (fallbackScript) {
    const words = fallbackScript.trim().split(/\s+/).length;
    return Math.max(3.0, parseFloat(((words / 130) * 60 + 1.5).toFixed(2)));
  }

  return 12.0;
}

/**
 * Tìm file audio thực tế trong các thư mục public
 */
function resolveAudioFilePath(audioFileUrl: string): string {
  const cleanPath = audioFileUrl.replace(/^\//, '');
  const searchDirs = [
    path.join(ROOT_DIR, 'client', 'public'),
    path.join(ROOT_DIR, 'public'),
    path.join(ROOT_DIR, 'client', 'public', 'audio'),
    path.join(ROOT_DIR, 'public', 'audio'),
  ];

  for (const base of searchDirs) {
    const p1 = path.join(base, cleanPath);
    if (fs.existsSync(p1)) return p1;

    const p2 = path.join(base, 'audio', cleanPath);
    if (fs.existsSync(p2)) return p2;
  }

  // Mặc định trả về đường dẫn trong client/public
  return path.join(ROOT_DIR, 'client', 'public', cleanPath);
}

// ==============================================================================
// 2. TÍNH TOÁN TIMELINE CỘNG DỒN CHO TỪNG PASSAGE & QUESTION
// ==============================================================================
interface TimelinePassage {
  id?: string;
  id_ref?: string;
  part?: number;
  part_number?: number;
  audioFile?: string | null;
  audio_url?: string | null;
  audioScript?: string | null;
  transcript?: string | null;
  startTime?: number | null;
  endTime?: number | null;
  duration?: number;
  silenceAfterSeconds?: number;
  questions?: Array<{
    number?: number;
    question_number?: number;
    audio_timestamp?: number | null;
    silence_after_seconds?: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

function processPassageList(
  passages: TimelinePassage[],
  initialStartTime: number,
  fallbackPartNumber?: number
): { updatedPassages: TimelinePassage[]; finalEndTime: number; logSummary: string[] } {
  let currentTime = initialStartTime;
  const logSummary: string[] = [];

  for (let i = 0; i < passages.length; i++) {
    const p = passages[i];
    const partNum = Number(p.part || p.part_number || fallbackPartNumber || 1);

    // Chỉ tính timeline cho Listening (Part 1 - 4)
    if (partNum > 4) {
      p.startTime = null;
      p.endTime = null;
      continue;
    }

    const audioRelPath = p.audioFile || p.audio_url || '';
    const script = p.audioScript || p.transcript || '';
    const localAudioPath = resolveAudioFilePath(audioRelPath);

    // 1. Tính độ dài phát của đoạn audio
    const audioDuration = getAudioDurationInSeconds(localAudioPath, script);

    // 2. Gán mốc bắt đầu và kết thúc
    const passageStart = parseFloat(currentTime.toFixed(2));
    const passageEnd = parseFloat((passageStart + audioDuration).toFixed(2));

    p.startTime = passageStart;
    p.endTime = passageEnd;
    p.duration = audioDuration;

    // 3. Tính khoảng im lặng nghỉ sau câu/đoạn
    const qCount = Array.isArray(p.questions) ? p.questions.length : 1;
    let silenceDuration = 5;

    if (partNum === 1) {
      silenceDuration = SILENCE_CONFIG.PART_1_SECONDS;
    } else if (partNum === 2) {
      silenceDuration = SILENCE_CONFIG.PART_2_SECONDS;
    } else if (partNum === 3) {
      silenceDuration = SILENCE_CONFIG.PART_3_SECONDS_PER_QUESTION * qCount;
    } else if (partNum === 4) {
      silenceDuration = SILENCE_CONFIG.PART_4_SECONDS_PER_QUESTION * qCount;
    }

    p.silenceAfterSeconds = silenceDuration;

    // 4. Cập nhật mốc timestamp và silence cho từng câu hỏi con
    if (Array.isArray(p.questions)) {
      for (const q of p.questions) {
        q.audio_timestamp = passageStart;
        q.silence_after_seconds =
          partNum <= 2
            ? silenceDuration
            : partNum === 3
            ? SILENCE_CONFIG.PART_3_SECONDS_PER_QUESTION
            : SILENCE_CONFIG.PART_4_SECONDS_PER_QUESTION;
      }
    }

    // Ghi log
    const qLabel = p.questions?.[0]?.number || p.questions?.[0]?.question_number || `P${i + 1}`;
    logSummary.push(
      `Part ${partNum} | Câu #${qLabel.toString().padEnd(3)} | ` +
        `Start: ${formatTime(passageStart)} (${passageStart}s) ➔ ` +
        `End: ${formatTime(passageEnd)} (${passageEnd}s) | ` +
        `Thời lượng: ${audioDuration}s + Nghỉ: ${silenceDuration}s`
    );

    // Cộng dồn thời gian cho câu tiếp theo
    currentTime = passageEnd + silenceDuration;
  }

  return { updatedPassages: passages, finalEndTime: currentTime, logSummary };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ==============================================================================
// 3. XỬ LÝ FILE ĐỀ THI JSON
// ==============================================================================
export function buildTimelineForFile(filePath: string): boolean {
  console.log(`\n📄 Đang xử lý: \x1b[1m${path.basename(filePath)}\x1b[0m...`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File không tồn tại: ${filePath}`);
    return false;
  }

  let fileContent: string;
  try {
    fileContent = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`❌ Không đọc được file: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }

  let jsonData: Record<string, unknown>;
  try {
    jsonData = JSON.parse(fileContent);
  } catch (err) {
    console.error(`❌ Cú pháp JSON không hợp lệ: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }

  let currentTime = 0.0;
  let allLogs: string[] = [];

  // DẠNG 1: File Part đơn lẻ { part: 1, passages: [...] }
  if (jsonData.part && Array.isArray(jsonData.passages)) {
    const partNum = Number(jsonData.part);
    const res = processPassageList(jsonData.passages as TimelinePassage[], currentTime, partNum);
    jsonData.passages = res.updatedPassages;
    currentTime = res.finalEndTime;
    allLogs = res.logSummary;
  }
  // DẠNG 2: File có cấu trúc parts [ { part: 1, passages: [...] } ]
  else if (Array.isArray(jsonData.parts)) {
    for (const part of jsonData.parts as Array<{ part: number; passages: TimelinePassage[] }>) {
      if (Array.isArray(part.passages)) {
        const res = processPassageList(part.passages, currentTime, part.part);
        part.passages = res.updatedPassages;
        currentTime = res.finalEndTime;
        allLogs = allLogs.concat(res.logSummary);
      }
    }
  }
  // DẠNG 3: File ExamData chuẩn { test: {...}, passages: [...], questions: [...] }
  else if (Array.isArray(jsonData.passages)) {
    const res = processPassageList(jsonData.passages as TimelinePassage[], currentTime);
    jsonData.passages = res.updatedPassages;
    currentTime = res.finalEndTime;
    allLogs = res.logSummary;

    // Cập nhật ngược timestamp vào mảng questions nếu có
    if (Array.isArray(jsonData.questions)) {
      const passageMap = new Map<string, TimelinePassage>();
      for (const p of jsonData.passages as TimelinePassage[]) {
        if (p.id_ref) passageMap.set(p.id_ref, p);
        if (p.id) passageMap.set(p.id, p);
      }

      for (const q of jsonData.questions as Array<{ passage_id_ref?: string; audio_timestamp?: number | null }>) {
        if (q.passage_id_ref && passageMap.has(q.passage_id_ref)) {
          const matchedPassage = passageMap.get(q.passage_id_ref)!;
          q.audio_timestamp = matchedPassage.startTime;
        }
      }
    }
  } else {
    console.error('⚠️ File không chứa mảng passages phù hợp để tính timeline.');
    return false;
  }

  // In chi tiết timeline từng câu
  console.log('\n\x1b[36m--- CHI TIẾT TIMELINE AUDIO ĐÃ CỘNG DỒN ---\x1b[0m');
  for (const logLine of allLogs) {
    console.log(`  \x1b[32m✔\x1b[0m ${logLine}`);
  }

  console.log(`\n⏱  Tổng thời lượng nghe tính toán: \x1b[33m${formatTime(currentTime)} (${currentTime.toFixed(1)} giây)\x1b[0m`);

  // Ghi ngược lại file JSON
  try {
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');
    console.log(`\x1b[32m✔ Đã ghi thành công startTime/endTime vào file: ${path.basename(filePath)}\x1b[0m`);
    return true;
  } catch (err) {
    console.error(`❌ Lỗi ghi file JSON: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

// ==============================================================================
// 4. MAIN RUNNER
// ==============================================================================
function main() {
  console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════════');
  console.log('\x1b[36m%s\x1b[0m', '  🎵 TOEIC TIMELINE BUILDER (FFPROBE & AUDIO PACING)');
  console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════════');

  const hasFf = checkFfprobe();
  if (hasFf) {
    console.log('⚡ Công cụ: \x1b[32mffprobe đã sẵn sàng\x1b[0m (độ chính xác mili-giây)');
  } else {
    console.log('⚡ Công cụ: \x1b[33mBộ phân tích MP3 header & AudioScript tích hợp sẵn\x1b[0m (ffprobe chưa có trong PATH)');
  }

  // Tìm các file cần xử lý
  let targetFiles: string[] = [];

  if (process.argv[2]) {
    const customPath = path.resolve(process.cwd(), process.argv[2]);
    if (fs.existsSync(customPath)) {
      if (fs.statSync(customPath).isDirectory()) {
        targetFiles = fs
          .readdirSync(customPath)
          .filter((f) => f.endsWith('.json'))
          .map((f) => path.join(customPath, f));
      } else {
        targetFiles = [customPath];
      }
    }
  }

  if (targetFiles.length === 0) {
    const defaultSearchDirs = [
      path.join(ROOT_DIR, 'client', 'src', 'data', 'tests'),
      path.join(ROOT_DIR, 'src', 'data', 'tests'),
      path.join(ROOT_DIR, 'data', 'tests'),
      path.join(ROOT_DIR, 'client', 'src', 'data'),
    ];

    for (const dir of defaultSearchDirs) {
      if (fs.existsSync(dir)) {
        const found = fs
          .readdirSync(dir)
          .filter((f) => f.endsWith('.json'))
          .map((f) => path.join(dir, f));
        if (found.length > 0) {
          targetFiles = found;
          break;
        }
      }
    }
  }

  if (targetFiles.length === 0) {
    console.error('❌ Không tìm thấy file JSON đề thi nào để cập nhật timeline.');
    process.exit(1);
  }

  let successCount = 0;
  for (const file of targetFiles) {
    const ok = buildTimelineForFile(file);
    if (ok) successCount++;
  }

  console.log(`\n🎉 Hoàn thành xử lý timeline cho ${successCount}/${targetFiles.length} file đề thi.\n`);
}

main();
