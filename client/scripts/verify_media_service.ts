/**
 * Test script to verify Supabase Storage private bucket 'test-media',
 * 2-hour signed URL generation, listening audio extraction,
 * memory blob caching, error reporting and preloading pipeline.
 */
import { mediaService, type PreloadAudioItem } from '../src/services/mediaService';
import sampleExamData from '../src/data/sample_mini_test.json';
import type { ExamData } from '../src/types/exam';

async function runTests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ MEDIASERVICE & SUPABASE STORAGE ===\n');
  let passed = 0;
  let total = 0;

  function assert(desc: string, condition: boolean) {
    total++;
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
    }
  }

  // Mock global environment for Node.js
  (globalThis as any).window = globalThis;
  (globalThis as any).URL.createObjectURL = (blob: any) => `blob:http://localhost:5173/${Math.random().toString(36).substring(2, 9)}`;
  (globalThis as any).URL.revokeObjectURL = (_url: string) => {};

  // Test 1: Nhận diện file thuộc bucket riêng tư 'test-media'
  console.log('--- Test 1: Nhận diện và chuẩn hóa đường dẫn Storage test-media ---');
  assert(
    "Nhận diện đúng prefix 'test-media:audios/p1.mp3'",
    mediaService.isSupabaseStorageMedia('test-media:audios/p1.mp3') === true
  );
  assert(
    "Nhận diện đúng prefix 'test-media/audios/p1.mp3'",
    mediaService.isSupabaseStorageMedia('test-media/audios/p1.mp3') === true
  );
  assert(
    "Nhận diện đúng đường dẫn tương đối 'user_123/test_abc/q1.mp3'",
    mediaService.isSupabaseStorageMedia('user_123/test_abc/q1.mp3') === true
  );
  assert(
    "Nhận diện đúng URL Supabase Storage test-media",
    mediaService.isSupabaseStorageMedia('https://xyz.supabase.co/storage/v1/object/sign/test-media/owner1/test1/audio.mp3?token=123') === true
  );
  assert(
    "Phân biệt chính xác URL ngoài (không phải Supabase test-media)",
    mediaService.isSupabaseStorageMedia('https://raw.githubusercontent.com/assets/audio.mp3') === false
  );

  assert(
    "Chuẩn hóa đường dẫn extractStoragePath từ prefix 'test-media:'",
    mediaService.extractStoragePath('test-media:audios/p1.mp3') === 'audios/p1.mp3'
  );
  assert(
    "Chuẩn hóa đường dẫn extractStoragePath từ URL Supabase Storage",
    mediaService.extractStoragePath('https://xyz.supabase.co/storage/v1/object/authenticated/test-media/folder/item.mp3') === 'folder/item.mp3'
  );

  // Test 2: Trích xuất toàn bộ danh sách audio phần Listening
  console.log('\n--- Test 2: Trích xuất danh sách audio Listening (Parts 1-4) ---');
  const exam = sampleExamData as unknown as ExamData;
  const audioItems = mediaService.extractListeningAudioItems(exam);

  assert(
    'Trích xuất được danh sách audio Listening từ đề thi',
    audioItems.length > 0
  );
  assert(
    'Có chứa audio full bài thi hoặc audio câu hỏi Part 1-4',
    audioItems.some((item) => item.partNumber === 1 || item.partNumber === 2 || item.partNumber === 3 || item.partNumber === 4)
  );
  assert(
    'Không chứa các câu thuộc phần Reading (Part 5-7)',
    audioItems.every((item) => item.partNumber === undefined || item.partNumber <= 4)
  );

  // Test 3: Signed URL & Caching
  console.log('\n--- Test 3: Lấy Signed URL (thời hạn 2 giờ) & Caching ---');
  const externalAudioUrl = 'https://raw.githubusercontent.com/assets/sample.mp3';
  const signedResult = await mediaService.getSignedMediaUrl(externalAudioUrl, 7200);
  assert(
    'URL ngoài được bảo toàn không qua chuyển đổi bucket',
    signedResult === externalAudioUrl
  );

  const storageMedia = 'test-media:audios/exam_full.mp3';
  const storageSigned = await mediaService.getSignedMediaUrl(storageMedia, 7200);
  assert(
    'Sinh được URL cho media trong bucket test-media',
    typeof storageSigned === 'string' && storageSigned.length > 0
  );

  // Test 4: Pipeline Preload Audio & In-Memory Blob Cache
  console.log('\n--- Test 4: Preload Audio & Lưu Cache bộ nhớ RAM ---');
  // Mock fetch cho audio giả lập
  const originalFetch = globalThis.fetch;
  (globalThis as any).fetch = async (url: string) => {
    if (url.includes('broken-audio-file')) {
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      };
    }
    return {
      ok: true,
      status: 200,
      blob: async () => new Blob(['mock-audio-binary-data'], { type: 'audio/mp3' }),
    };
  };

  const testAudioList: PreloadAudioItem[] = [
    { id: '1', title: 'Part 1 Question 1', url: 'https://cdn.example.com/audio/q1.mp3', partNumber: 1 },
    { id: '2', title: 'Part 2 Question 2', url: 'test-media:audio/q2.mp3', partNumber: 2 },
  ];

  let progressReportedCount = 0;
  const preloadResult = await mediaService.preloadListeningAudios(testAudioList, (p) => {
    progressReportedCount++;
  });

  assert('Preload thành công 100% các file hợp lệ', preloadResult.success === true);
  assert('Đã nạp đúng 2/2 file audio', preloadResult.loadedCount === 2);
  assert('Thanh tiến trình onProgress được gọi liên tục', progressReportedCount > 0);
  assert('File audio đã nạp được lưu trong memory cache', mediaService.isAudioPreloaded(testAudioList[0].url) === true);

  const playableUrl = mediaService.getPlayableAudioUrl(testAudioList[0].url);
  assert(
    'getPlayableAudioUrl trả về Blob URL trực tiếp từ RAM (không qua mạng)',
    playableUrl.startsWith('blob:')
  );

  // Test 5: Bắt lỗi khi audio hỏng và ngăn chặn bắt đầu bài thi
  console.log('\n--- Test 5: Bắt lỗi khi audio hỏng & Không cho bắt đầu thi ---');
  const listWithBrokenAudio: PreloadAudioItem[] = [
    { id: '3', title: 'Part 3 Broken Audio', url: 'https://cdn.example.com/broken-audio-file.mp3', partNumber: 3 },
  ];

  const failedResult = await mediaService.preloadListeningAudios(listWithBrokenAudio);
  assert(
    'Phát hiện lỗi tải audio khi mạng/file có vấn đề',
    failedResult.success === false && failedResult.failedItems.length === 1
  );
  assert(
    'Báo cáo rõ ràng tên file và nội dung lỗi tải',
    failedResult.failedItems[0].item.title === 'Part 3 Broken Audio' &&
    failedResult.failedItems[0].error.includes('404')
  );

  // Khôi phục fetch gốc
  globalThis.fetch = originalFetch;

  console.log(`\n=== TỔNG KẾT: ĐẠT ${passed}/${total} BÀI KIỂM THỬ ===\n`);
  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Lỗi kiểm thử:', e);
  process.exit(1);
});
