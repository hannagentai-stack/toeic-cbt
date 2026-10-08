import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { ExamData } from '../types/exam';
import type { SavedAttempt } from './attemptService';
import defaultMiniTest from '../data/sample_mini_test.json';

const LEGACY_ATTEMPTS_KEY = 'toeic_cbt_exam_attempts_history';
const LEGACY_TESTS_KEY = 'toeic_admin_tests_bank';
const LEGACY_CANDIDATE_KEY = 'toeic_saved_candidate';
const MIGRATION_COMPLETED_KEY = 'toeic_migration_completed';
const MIGRATION_DISMISSED_KEY = 'toeic_migration_dismissed';

export interface LegacyDataSummary {
  attemptsCount: number;
  customTestsCount: number;
  hasCandidate: boolean;
  candidateName?: string;
}

export const migrationService = {
  /**
   * Kiểm tra xem có dữ liệu cũ trên thiết bị cần chuyển lên Supabase không
   */
  hasLegacyData: (): boolean => {
    try {
      if (typeof window === 'undefined') return false;

      // Nếu đã chuyển hoặc người dùng chọn bỏ qua trong phiên này
      if (localStorage.getItem(MIGRATION_COMPLETED_KEY) === 'true') return false;
      if (sessionStorage.getItem(MIGRATION_DISMISSED_KEY) === 'true') return false;

      const summary = migrationService.getLegacyDataSummary();
      return summary.attemptsCount > 0 || summary.customTestsCount > 0;
    } catch {
      return false;
    }
  },

  /**
   * Lấy bản tóm tắt số lượng dữ liệu cũ
   */
  getLegacyDataSummary: (): LegacyDataSummary => {
    let attemptsCount = 0;
    let customTestsCount = 0;
    let hasCandidate = false;
    let candidateName: string | undefined;

    try {
      // 1. Attempts
      const rawAttempts = localStorage.getItem(LEGACY_ATTEMPTS_KEY);
      if (rawAttempts) {
        const attempts = JSON.parse(rawAttempts) as SavedAttempt[];
        if (Array.isArray(attempts)) {
          attemptsCount = attempts.length;
        }
      }

      // 2. Custom Tests (không tính đề mẫu mặc định)
      const rawTests = localStorage.getItem(LEGACY_TESTS_KEY);
      if (rawTests) {
        const tests = JSON.parse(rawTests) as ExamData[];
        if (Array.isArray(tests)) {
          const sampleCode = (defaultMiniTest as unknown as ExamData).test.code;
          customTestsCount = tests.filter((t) => t.test.code !== sampleCode).length;
        }
      }

      // 3. Candidate Info
      const rawCand = localStorage.getItem(LEGACY_CANDIDATE_KEY);
      if (rawCand) {
        const cand = JSON.parse(rawCand);
        if (cand && cand.fullName && cand.fullName !== 'NGUYỄN VĂN AN') {
          hasCandidate = true;
          candidateName = cand.fullName;
        }
      }
    } catch (e) {
      console.warn('[migrationService] Lỗi khi đọc dữ liệu cũ:', e);
    }

    return {
      attemptsCount,
      customTestsCount,
      hasCandidate,
      candidateName,
    };
  },

  /**
   * Bỏ qua thông báo chuyển dữ liệu trong phiên làm việc hiện tại
   */
  dismissMigration: (): void => {
    try {
      sessionStorage.setItem(MIGRATION_DISMISSED_KEY, 'true');
    } catch {}
  },

  /**
   * Chuyển toàn bộ dữ liệu từ localStorage lên tài khoản Supabase hiện tại
   * và xóa dữ liệu cũ sau khi chuyển thành công
   */
  migrateLegacyDataToSupabase: async (
    userId: string
  ): Promise<{
    success: boolean;
    migratedAttempts: number;
    migratedTests: number;
    error?: string;
  }> => {
    if (!isSupabaseConfigured || !userId) {
      return { success: false, migratedAttempts: 0, migratedTests: 0, error: 'Chưa đăng nhập hoặc thiếu Supabase.' };
    }

    let migratedAttempts = 0;
    let migratedTests = 0;

    try {
      // 1. Chuyển Lịch sử làm bài (Attempts)
      const rawAttempts = localStorage.getItem(LEGACY_ATTEMPTS_KEY);
      if (rawAttempts) {
        const attempts = JSON.parse(rawAttempts) as SavedAttempt[];
        if (Array.isArray(attempts) && attempts.length > 0) {
          const attemptPayloads = attempts.map((a) => ({
            id: a.id || `migrated_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            user_id: userId,
            test_id: a.testId,
            mode: a.mode || 'full',
            config: {
              testTitle: a.testTitle,
              skill: a.skill,
              parts: a.parts,
            },
            answers: a.answers || {},
            score_listening: a.scoreResult?.listeningScaledScore || 0,
            score_reading: a.scoreResult?.readingScaledScore || 0,
            duration_seconds: a.timeSpentSeconds || 0,
            status: 'submitted',
            started_at: a.createdAt || new Date().toISOString(),
            submitted_at: a.createdAt || new Date().toISOString(),
          }));

          const { error: attError } = await supabase
            .from('attempts')
            .upsert(attemptPayloads, { onConflict: 'id' });

          if (!attError) {
            migratedAttempts = attemptPayloads.length;
          } else {
            console.warn('[migrationService] Lỗi khi chuyển attempts:', attError.message);
          }
        }
      }

      // 2. Chuyển Ngân hàng đề thi tùy chỉnh (Custom Tests)
      const rawTests = localStorage.getItem(LEGACY_TESTS_KEY);
      if (rawTests) {
        const tests = JSON.parse(rawTests) as ExamData[];
        if (Array.isArray(tests)) {
          const sampleCode = (defaultMiniTest as unknown as ExamData).test.code;
          const customOnly = tests.filter((t) => t.test.code !== sampleCode);

          if (customOnly.length > 0) {
            const testPayloads = customOnly.map((t) => ({
              id: t.test.code,
              owner_id: userId,
              title: t.test.title,
              is_public: false,
              is_complete: true,
              source_format: 'json',
              data: t,
              updated_at: new Date().toISOString(),
            }));

            const { error: testError } = await supabase
              .from('tests')
              .upsert(testPayloads, { onConflict: 'id' });

            if (!testError) {
              migratedTests = testPayloads.length;
            } else {
              console.warn('[migrationService] Lỗi khi chuyển tests:', testError.message);
            }
          }
        }
      }

      // 3. Chuyển Hồ sơ thí sinh (Candidate info) nếu có
      const rawCand = localStorage.getItem(LEGACY_CANDIDATE_KEY);
      if (rawCand) {
        const cand = JSON.parse(rawCand);
        if (cand && cand.fullName && cand.fullName !== 'NGUYỄN VĂN AN') {
          await supabase
            .from('profiles')
            .update({
              full_name: cand.fullName,
              date_of_birth: cand.dateOfBirth || '',
              candidate_id: cand.candidateId || '',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }
      }

      // Đánh dấu đã chuyển thành công và dọn dẹp các key cũ
      localStorage.setItem(MIGRATION_COMPLETED_KEY, 'true');
      localStorage.removeItem(LEGACY_ATTEMPTS_KEY);
      // Chỉ giữ lại đề mẫu trong tests bank
      localStorage.setItem(LEGACY_TESTS_KEY, JSON.stringify([defaultMiniTest]));

      console.log(`[migrationService] ✓ Đã chuyển thành công: ${migratedAttempts} lượt thi, ${migratedTests} đề thi.`);
      return {
        success: true,
        migratedAttempts,
        migratedTests,
      };
    } catch (err: any) {
      console.error('[migrationService] Ngoại lệ khi chuyển dữ liệu:', err);
      return {
        success: false,
        migratedAttempts,
        migratedTests,
        error: err.message || 'Lỗi không xác định khi chuyển dữ liệu.',
      };
    }
  },
};
