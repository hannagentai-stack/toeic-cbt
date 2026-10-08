import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { ExamScoreResult } from '../utils/scoreCalculator';
import type { OptionLabel } from '../types/exam';
import type { ExamMode } from '../types/session';

export interface SavedAttempt {
  id: string;
  testId: string;
  testTitle: string;
  createdAt: string;
  scoreResult: ExamScoreResult;
  answers: Record<number, OptionLabel>;
  mode?: ExamMode;
  skill?: 'listening' | 'reading';
  parts?: number[];
  timeSpentSeconds?: number;
  status?: 'in_progress' | 'submitted';
}

const STORAGE_KEY = 'toeic_cbt_exam_attempts_history';
const IN_PROGRESS_KEY = 'toeic_cbt_current_in_progress';
const PENDING_SYNC_QUEUE_KEY = 'toeic_cbt_pending_attempts_sync';

// Hàng đợi thử lại đồng bộ khi có mạng trở lại
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    attemptService.syncPendingAttempts();
  });
}

export const attemptService = {
  /**
   * Lưu kết quả hoàn thành bài thi vào Supabase bảng attempts (status = 'submitted')
   * Đồng thời lưu cục bộ và thử lại nếu mất mạng
   */
  saveAttempt: async (
    testId: string,
    testTitle: string,
    scoreResult: ExamScoreResult,
    answers: Record<number, OptionLabel>,
    mode: ExamMode = 'full',
    skill?: 'listening' | 'reading',
    parts?: number[],
    timeSpentSeconds?: number,
    configPayload?: Record<string, any>
  ): Promise<SavedAttempt> => {
    const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newAttempt: SavedAttempt = {
      id: attemptId,
      testId,
      testTitle,
      createdAt: new Date().toISOString(),
      scoreResult,
      answers,
      mode,
      skill,
      parts,
      timeSpentSeconds,
      status: 'submitted',
    };

    // 1. Luôn lưu vào localStorage ngay lập tức (không bao giờ mất dữ liệu)
    try {
      const history = attemptService.getAllAttemptsSync();
      const updatedHistory = [newAttempt, ...history.filter((a) => a.id !== attemptId)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      // Xóa tiến độ làm dở vì đã nộp bài thành công
      localStorage.removeItem(IN_PROGRESS_KEY);
    } catch (err) {
      console.error('[attemptService] Lỗi khi lưu vào localStorage:', err);
    }

    // 2. Đồng bộ lên Supabase
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const payload = {
            id: attemptId,
            user_id: user.id,
            test_id: testId,
            mode,
            config: {
              ...(configPayload || {}),
              testTitle,
              skill,
              parts,
            },
            answers,
            score_listening: scoreResult.listeningScaledScore || 0,
            score_reading: scoreResult.readingScaledScore || 0,
            duration_seconds: timeSpentSeconds || 0,
            status: 'submitted',
            started_at: newAttempt.createdAt,
            submitted_at: new Date().toISOString(),
          };

          const { error } = await supabase.from('attempts').insert(payload);

          if (error) {
            console.warn('[attemptService] Lỗi khi gửi attempt lên Supabase, xếp vào hàng đợi đồng bộ:', error.message);
            attemptService.queuePendingSync(payload);
          } else {
            // Xóa mọi bản ghi in_progress của user cho đề này nếu có
            await supabase
              .from('attempts')
              .delete()
              .eq('user_id', user.id)
              .eq('test_id', testId)
              .eq('status', 'in_progress');
          }
        }
      } catch (networkErr) {
        console.warn('[attemptService] Ngoại lệ mạng khi lưu attempt:', networkErr);
      }
    }

    return newAttempt;
  },

  /**
   * Tự động lưu tiến độ làm dở (debounce) vào Supabase attempts với status = 'in_progress'
   */
  saveInProgressProgress: async (
    testId: string,
    testTitle: string,
    answers: Record<number, OptionLabel>,
    timeSpentSeconds: number,
    mode: ExamMode = 'full',
    configPayload?: Record<string, any>
  ): Promise<{ success: boolean; id?: string }> => {
    const inProgressData = {
      testId,
      testTitle,
      answers,
      timeSpentSeconds,
      mode,
      config: configPayload,
      updatedAt: new Date().toISOString(),
    };

    // 1. Lưu cục bộ ngay
    try {
      localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify(inProgressData));
    } catch {}

    // 2. Đồng bộ lên Supabase nếu có kết nối
    if (!isSupabaseConfigured) {
      return { success: true };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: true };

      const attemptId = `in_progress_${user.id}_${testId}`;

      const payload = {
        id: attemptId,
        user_id: user.id,
        test_id: testId,
        mode,
        config: {
          ...(configPayload || {}),
          testTitle,
        },
        answers,
        score_listening: 0,
        score_reading: 0,
        duration_seconds: timeSpentSeconds,
        status: 'in_progress',
        started_at: inProgressData.updatedAt,
      };

      const { error } = await supabase
        .from('attempts')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn('[attemptService] Lỗi auto-save Supabase:', error.message);
        return { success: false };
      }

      return { success: true, id: attemptId };
    } catch {
      return { success: false };
    }
  },

  /**
   * Lấy bài thi đang làm dở gần nhất (để cho phép "Tiếp tục bài đang làm")
   * Ưu tiên tài khoản hiện tại từ Supabase để tránh rò rỉ giữa 2 tài khoản khác nhau
   */
  getInProgressAttempt: async (): Promise<{
    testId: string;
    testTitle: string;
    answers: Record<number, OptionLabel>;
    timeSpentSeconds: number;
    mode: ExamMode;
    config?: Record<string, any>;
  } | null> => {
    // 1. Kiểm tra tài khoản hiện tại trên Supabase trước
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Chưa đăng nhập thì không tải tiến độ của ai cả
          return null;
        }

        const { data, error } = await supabase
          .from('attempts')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'in_progress')
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          return {
            testId: data.test_id,
            testTitle: data.config?.testTitle || data.test_id,
            answers: data.answers || {},
            timeSpentSeconds: data.duration_seconds || 0,
            mode: data.mode as ExamMode,
            config: data.config,
          };
        }
      } catch {}
    }

    // 2. Fallback sang localStorage nếu offline
    try {
      const raw = localStorage.getItem(IN_PROGRESS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.answers && Object.keys(parsed.answers).length > 0) {
          return parsed;
        }
      }
    } catch {}

    return null;
  },

  /**
   * Xóa bài thi đang làm dở
   */
  clearInProgressAttempt: async (testId?: string): Promise<void> => {
    try {
      localStorage.removeItem(IN_PROGRESS_KEY);
    } catch {}

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          let query = supabase.from('attempts').delete().eq('user_id', user.id).eq('status', 'in_progress');
          if (testId) {
            query = query.eq('test_id', testId);
          }
          await query;
        }
      } catch {}
    }
  },

  /**
   * Lấy toàn bộ lịch sử thi đồng bộ từ cache (phục vụ UI ngay)
   */
  getAllAttemptsSync: (): SavedAttempt[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as SavedAttempt[];
    } catch (err) {
      console.error('[attemptService] Lỗi khi đọc lịch sử attempts:', err);
      return [];
    }
  },

  /**
   * Lấy toàn bộ lịch sử thi đồng bộ (tương thích 100% giao diện cũ)
   */
  getAllAttempts: (): SavedAttempt[] => {
    return attemptService.getAllAttemptsSync();
  },

  /**
   * Lấy toàn bộ lịch sử thi từ Supabase (cô lập chính xác theo từng tài khoản)
   */
  getAllAttemptsAsync: async (): Promise<SavedAttempt[]> => {
    if (!isSupabaseConfigured) {
      return attemptService.getAllAttemptsSync();
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.warn('[attemptService] Lỗi tải attempts từ Supabase:', error.message);
        return attemptService.getAllAttemptsSync();
      }

      // Query thành công: Chuyển đổi dữ liệu của tài khoản hiện tại
      const remoteAttempts: SavedAttempt[] = (data || []).map((item) => {
        const config = item.config || {};
        const listeningScore = item.score_listening || 0;
        const readingScore = item.score_reading || 0;
        const totalScore = listeningScore + readingScore;

        return {
          id: item.id,
          testId: item.test_id || 'test_cbt',
          testTitle: config.testTitle || `TOEIC Exam - ${item.test_id}`,
          createdAt: item.submitted_at || item.started_at,
          scoreResult: {
            listeningRawScore: Math.round(listeningScore / 4.95),
            listeningTotalQuestions: 100,
            listeningScaledScore: listeningScore,
            readingRawScore: Math.round(readingScore / 4.95),
            readingTotalQuestions: 100,
            readingScaledScore: readingScore,
            totalScore,
            totalCorrect: Math.round(totalScore / 4.95),
            totalQuestions: 200,
            overallAccuracy: Math.round((totalScore / 990) * 100),
            durationSeconds: item.duration_seconds || 0,
            avgSecondsPerQuestion: Math.round((item.duration_seconds || 0) / 200),
            partStats: [],
            weaknesses: [],
            recommendations: [],
          },
          answers: item.answers || {},
          mode: item.mode as ExamMode,
          skill: config.skill,
          parts: config.parts,
          timeSpentSeconds: item.duration_seconds || 0,
          status: 'submitted',
        };
      });

      // Cập nhật lại cache cho tài khoản hiện tại (nếu 0 attempt thì lưu rỗng, không lưu của người khác)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteAttempts));
      } catch {}

      return remoteAttempts;
    } catch (err) {
      console.error('[attemptService] Ngoại lệ khi lấy attempts:', err);
      return attemptService.getAllAttemptsSync();
    }
  },

  /**
   * Lọc danh sách attempts theo chế độ thi
   */
  getAttemptsByMode: (mode?: ExamMode | 'all'): SavedAttempt[] => {
    const list = attemptService.getAllAttemptsSync();
    if (!mode || mode === 'all') return list;
    return list.filter((a) => (a.mode || 'full') === mode);
  },

  /**
   * Lấy lần thi gần nhất
   */
  getLatestAttempt: (): SavedAttempt | null => {
    const list = attemptService.getAllAttemptsSync();
    return list.length > 0 ? list[0] : null;
  },

  /**
   * Lấy lần thi theo ID
   */
  getAttemptById: (id: string): SavedAttempt | null => {
    const list = attemptService.getAllAttemptsSync();
    return list.find((a) => a.id === id) || null;
  },

  /**
   * Lấy danh sách câu làm sai
   */
  getIncorrectQuestions: (
    attemptId: string,
    questions: import('../types/exam').Question[]
  ): import('../types/exam').Question[] => {
    const attempt = attemptService.getAttemptById(attemptId) || attemptService.getLatestAttempt();
    if (!attempt) return [];

    return questions.filter((q) => {
      const candidateAnswer = attempt.answers[q.question_number];
      return candidateAnswer !== q.correct_option;
    });
  },

  /**
   * Xóa một lần thi theo ID
   */
  deleteAttempt: async (id: string): Promise<void> => {
    try {
      const history = attemptService.getAllAttemptsSync();
      const filtered = history.filter((a) => a.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (err) {
      console.error('[attemptService] Lỗi khi xóa attempt:', err);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('attempts').delete().eq('id', id);
      } catch {}
    }
  },

  /**
   * Xóa toàn bộ lịch sử thi
   */
  clearHistory: async (): Promise<void> => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('attempts').delete().eq('user_id', user.id);
        }
      } catch {}
    }
  },

  /**
   * Hàng đợi và tự động đồng bộ khi mất mạng
   */
  queuePendingSync: (payload: any): void => {
    try {
      const raw = localStorage.getItem(PENDING_SYNC_QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      queue.push(payload);
      localStorage.setItem(PENDING_SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch {}
  },

  syncPendingAttempts: async (): Promise<void> => {
    if (!isSupabaseConfigured) return;

    try {
      const raw = localStorage.getItem(PENDING_SYNC_QUEUE_KEY);
      if (!raw) return;
      const queue = JSON.parse(raw) as any[];
      if (!Array.isArray(queue) || queue.length === 0) return;

      console.log(`[attemptService] Đang tự động gửi ${queue.length} attempt đang chờ từ chế độ offline...`);

      const remaining: any[] = [];
      for (const item of queue) {
        const { error } = await supabase.from('attempts').upsert(item, { onConflict: 'id' });
        if (error) {
          remaining.push(item);
        }
      }

      if (remaining.length > 0) {
        localStorage.setItem(PENDING_SYNC_QUEUE_KEY, JSON.stringify(remaining));
      } else {
        localStorage.removeItem(PENDING_SYNC_QUEUE_KEY);
        console.log('[attemptService] ✓ Đã đồng bộ toàn bộ attempts thành công!');
      }
    } catch (err) {
      console.warn('[attemptService] Lỗi xử lý hàng đợi offline:', err);
    }
  },
  /**
   * Xóa toàn bộ bộ nhớ đệm lịch sử thi và tiến độ làm dở khi đăng xuất
   */
  clearSessionCache: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(IN_PROGRESS_KEY);
      localStorage.removeItem(PENDING_SYNC_QUEUE_KEY);
    } catch {}
  },
};
