/**
 * Test script to verify Supabase storage layer replacement:
 * - testService, attemptService, profileService interfaces and behavior
 * - in_progress autosave and resume
 * - legacy data migration and cleanup
 * - offline queue and retry
 */
import { attemptService } from '../src/services/attemptService';
import { testService } from '../src/services/testService';
import { profileService } from '../src/services/profileService';
import { migrationService } from '../src/services/migrationService';

async function runTests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ DỊCH VỤ SUPABASE & LƯU TRỮ ===\n');
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

  // Mock window, localStorage and sessionStorage for Node environment
  (globalThis as any).window = globalThis;
  const mockStorage: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (k: string) => mockStorage[k] || null,
    setItem: (k: string, v: string) => { mockStorage[k] = v; },
    removeItem: (k: string) => { delete mockStorage[k]; },
    clear: () => {
      for (const k of Object.keys(mockStorage)) delete mockStorage[k];
    },
  };

  const mockSessionStorage: Record<string, string> = {};
  (globalThis as any).sessionStorage = {
    getItem: (k: string) => mockSessionStorage[k] || null,
    setItem: (k: string, v: string) => { mockSessionStorage[k] = v; },
    removeItem: (k: string) => { delete mockSessionStorage[k]; },
    clear: () => {
      for (const k of Object.keys(mockSessionStorage)) delete mockSessionStorage[k];
    },
  };

  // Test 1: Các service được xuất đầy đủ và hàm đúng chữ ký
  assert(
    'testService, attemptService, profileService tồn tại trong src/services/',
    Boolean(testService && attemptService && profileService && migrationService)
  );

  assert(
    'testService có getAllTests, getTestByCode, saveTest, importTestFromJson, uploadMediaToStorage',
    typeof testService.getAllTests === 'function' &&
    typeof testService.getTestByCode === 'function' &&
    typeof testService.saveTest === 'function' &&
    typeof testService.importTestFromJson === 'function' &&
    typeof testService.uploadMediaToStorage === 'function'
  );

  assert(
    'attemptService có saveAttempt, saveInProgressProgress, getInProgressAttempt, clearInProgressAttempt, getAllAttempts',
    typeof attemptService.saveAttempt === 'function' &&
    typeof attemptService.saveInProgressProgress === 'function' &&
    typeof attemptService.getInProgressAttempt === 'function' &&
    typeof attemptService.clearInProgressAttempt === 'function' &&
    typeof attemptService.getAllAttempts === 'function'
  );

  // Test 2: Tiến độ làm dở (saveInProgressProgress & getInProgressAttempt)
  console.log('\n--- Test 2: Tiến độ làm dở (in_progress autosave) ---');
  const dummyAnswers = { 1: 'A' as const, 2: 'B' as const, 5: 'C' as const };
  const inProgRes = await attemptService.saveInProgressProgress(
    'TEST_SAMPLE_01',
    'Đề thi thử TOEIC Đang làm dở',
    dummyAnswers,
    180,
    'full',
    { currentQuestionNumber: 5, remainingSeconds: 7020 }
  );
  assert('saveInProgressProgress trả về thành công', inProgRes.success === true);

  const restoredProg = await attemptService.getInProgressAttempt();
  assert('getInProgressAttempt khôi phục đúng đề thi đang làm dở', Boolean(restoredProg && restoredProg.testId === 'TEST_SAMPLE_01'));
  assert('getInProgressAttempt khôi phục đúng số câu đáp án', restoredProg?.answers[1] === 'A' && restoredProg?.answers[2] === 'B');

  // Test 3: Xóa tiến độ làm dở khi hoàn thành / nộp bài
  console.log('\n--- Test 3: Hoàn thành bài thi và xóa tiến độ làm dở ---');
  await attemptService.saveAttempt(
    'TEST_SAMPLE_01',
    'Đề thi thử TOEIC Đang làm dở',
    {
      listeningScaledScore: 350,
      readingScaledScore: 320,
      listeningRawScore: 70,
      readingRawScore: 65,
      totalScore: 670,
      listeningTotalQuestions: 100,
      readingTotalQuestions: 100,
      totalCorrect: 135,
      totalQuestions: 200,
      overallAccuracy: 67.5,
      durationSeconds: 3600,
      avgSecondsPerQuestion: 18,
      partStats: [],
      weaknesses: [],
      recommendations: [],
    },
    dummyAnswers,
    'full',
    undefined,
    undefined,
    3600
  );

  const progAfterSubmit = await attemptService.getInProgressAttempt();
  assert('Tiến độ làm dở được xóa tự động sau khi saveAttempt (status = submitted)', progAfterSubmit === null);

  const allAttempts = attemptService.getAllAttempts();
  assert('getAllAttempts lưu lại bản ghi bài thi đã nộp', allAttempts.length > 0 && allAttempts[0].testId === 'TEST_SAMPLE_01');

  // Test 4: Hàng đợi offline và tự động thử lại (syncPendingAttempts)
  console.log('\n--- Test 4: Hàng đợi offline & chống mất đáp án ---');
  attemptService.queuePendingSync({ test_id: 'OFFLINE_ATTEMPT', answers: { 1: 'D' } });
  const pendingQueue = JSON.parse(mockStorage['toeic_cbt_pending_attempts_sync'] || '[]');
  assert('Hàng đợi offline lưu bài làm vào pending sync queue', pendingQueue.length === 1 && pendingQueue[0].test_id === 'OFFLINE_ATTEMPT');

  // Test 5: Import đề thi từ JSON
  console.log('\n--- Test 5: Import đề thi JSON ---');
  const validJson = JSON.stringify({
    test: {
      title: 'Đề nhập từ JSON kiểm thử',
      code: 'IMPORT_TEST_01',
      description: 'Mô tả đề thi import',
      duration_minutes: 120,
      total_questions: 1,
    },
    parts: [],
    passages: [],
    questions: [
      {
        question_number: 1,
        part_number: 1,
        question_type: 'PHOTO',
        question_text: 'What is shown in the picture?',
        options: [
          { option_label: 'A', option_text: 'Option A' },
          { option_label: 'B', option_text: 'Option B' },
        ],
        correct_option: 'A',
      },
    ],
  });

  const importRes = await testService.importTestFromJson(validJson);
  assert('testService.importTestFromJson nhập đề hợp lệ thành công', importRes.success === true && importRes.data?.test.code === 'IMPORT_TEST_01');
  const loadedImportedTest = testService.getTestByCode('IMPORT_TEST_01');
  assert('Đề thi vừa import có thể truy xuất ngay lập tức qua getTestByCode', loadedImportedTest?.test.title === 'Đề nhập từ JSON kiểm thử');

  // Test 6: Di chuyển dữ liệu cũ (migrationService)
  console.log('\n--- Test 6: Di chuyển dữ liệu cũ (Legacy Data Migration) ---');
  // Giả lập dữ liệu cũ trong localStorage
  mockStorage['toeic_cbt_exam_attempts_history'] = JSON.stringify([
    { id: 'old_attempt_1', testId: 'OLD_TEST', testTitle: 'Bài thi cũ trên máy', answers: { 1: 'A' }, scoreResult: { listeningScaledScore: 300, readingScaledScore: 300 } }
  ]);
  mockStorage['toeic_saved_candidate'] = JSON.stringify({
    fullName: 'Trần Thị Thử Nghiệm',
    dateOfBirth: '2000-01-01',
    candidateId: 'VN-TEST-123'
  });

  const hasLegacy = migrationService.hasLegacyData();
  assert('migrationService.hasLegacyData phát hiện dữ liệu cũ trên máy', hasLegacy === true);

  const summary = migrationService.getLegacyDataSummary();
  assert('getLegacyDataSummary đếm đúng số bài thi cũ và thông tin thí sinh', summary.attemptsCount === 1 && summary.hasCandidate === true && summary.candidateName === 'Trần Thị Thử Nghiệm');

  // Bỏ qua migration
  migrationService.dismissMigration();
  assert('dismissMigration tạm hoãn hiển thị hộp thoại trong phiên', migrationService.hasLegacyData() === false);

  console.log(`\n=== TỔNG KẾT: ĐẠT ${passed}/${total} BÀI KIỂM THỬ ===\n`);
  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Lỗi khi chạy kiểm thử:', e);
  process.exit(1);
});
