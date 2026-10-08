import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { ExamData } from '../types/exam';
import defaultMiniTest from '../data/sample_mini_test.json';

const LOCAL_STORAGE_KEY = 'toeic_admin_tests_bank';

// Bộ nhớ đệm trong RAM để hiển thị giao diện tức thì
let inMemoryTestsCache: ExamData[] | null = null;

export interface TestMetadataRecord {
  id: string;
  owner_id: string | null;
  title: string;
  is_public: boolean;
  is_complete: boolean;
  source_format: string;
  created_at?: string;
}

export const testService = {
  /**
   * Khởi tạo bộ nhớ đệm ban đầu từ localStorage hoặc file mẫu
   */
  initLocalCache: (): ExamData[] => {
    if (inMemoryTestsCache && inMemoryTestsCache.length > 0) {
      return inMemoryTestsCache;
    }

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        inMemoryTestsCache = JSON.parse(raw) as ExamData[];
        return inMemoryTestsCache;
      }
    } catch (e) {
      console.warn('[testService] Lỗi khi đọc cache cục bộ:', e);
    }

    inMemoryTestsCache = [defaultMiniTest as unknown as ExamData];
    return inMemoryTestsCache;
  },

  /**
   * Lấy danh sách đề thi đồng bộ từ bộ nhớ đệm (dùng cho hiển thị ngay)
   */
  getAllTestsSync: (): ExamData[] => {
    return testService.initLocalCache();
  },

  /**
   * Lấy toàn bộ danh sách đề thi từ Supabase (Đề công khai + Đề do mình tạo)
   */
  getAllTests: async (): Promise<ExamData[]> => {
    testService.initLocalCache();

    if (!isSupabaseConfigured) {
      return inMemoryTestsCache || [defaultMiniTest as unknown as ExamData];
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Query: Đề công khai (is_public = true) HOẶC Đề của mình (owner_id = user.id)
      let query = supabase.from('tests').select('id, owner_id, title, is_public, data');
      
      if (user) {
        query = query.or(`is_public.eq.true,owner_id.eq.${user.id}`);
      } else {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.warn('[testService] Không thể tải đề từ Supabase, sử dụng cache:', error.message);
        return inMemoryTestsCache || [defaultMiniTest as unknown as ExamData];
      }

      if (data && data.length > 0) {
        const remoteTests: ExamData[] = data.map((item) => {
          const testObj = item.data as ExamData;
          // Gắn cờ sở hữu / công khai nếu cần
          if (testObj?.test) {
            (testObj.test as any).owner_id = item.owner_id;
            (testObj.test as any).is_public = item.is_public;
          }
          return testObj;
        });

        // Kết hợp với đề mẫu mặc định nếu chưa có
        const hasSample = remoteTests.some(
          (t) => t.test.code === (defaultMiniTest as unknown as ExamData).test.code
        );
        const combined = hasSample
          ? remoteTests
          : [...remoteTests, defaultMiniTest as unknown as ExamData];

        inMemoryTestsCache = combined;
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(combined));
        } catch {}

        return combined;
      }

      return inMemoryTestsCache || [defaultMiniTest as unknown as ExamData];
    } catch (err) {
      console.error('[testService] Ngoại lệ khi lấy đề thi:', err);
      return inMemoryTestsCache || [defaultMiniTest as unknown as ExamData];
    }
  },

  /**
   * Lấy một đề thi theo mã code (đồng bộ từ cache, tương thích 100% code cũ)
   */
  getTestByCode: (code: string): ExamData | null => {
    return testService.getTestByCodeSync(code);
  },

  /**
   * Lấy đề thi theo mã code đồng bộ từ cache
   */
  getTestByCodeSync: (code: string): ExamData | null => {
    const list = testService.getAllTestsSync();
    return list.find((t) => t.test.code === code) || null;
  },

  /**
   * Lấy đề thi bất đồng bộ từ Supabase nếu cần
   */
  getTestByCodeAsync: async (code: string): Promise<ExamData | null> => {
    const cached = testService.getTestByCodeSync(code);
    if (cached) return cached;

    if (!isSupabaseConfigured) return null;

    try {
      const { data, error } = await supabase
        .from('tests')
        .select('data')
        .eq('id', code)
        .maybeSingle();

      if (error || !data) return null;
      return data.data as ExamData;
    } catch {
      return null;
    }
  },

  /**
   * Lưu hoặc cập nhật một đề thi (lên Supabase tests + lưu cache)
   */
  saveTest: async (
    testData: ExamData,
    isPublic: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    // 1. Cập nhật cache cục bộ ngay lập tức
    const list = testService.getAllTestsSync();
    const index = list.findIndex((t) => t.test.code === testData.test.code);
    if (index !== -1) {
      list[index] = testData;
    } else {
      list.unshift(testData);
    }
    inMemoryTestsCache = [...list];
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch {}

    // 2. Đồng bộ lên Supabase nếu có kết nối
    if (!isSupabaseConfigured) {
      return { success: true };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const payload = {
        id: testData.test.code,
        owner_id: user?.id || null,
        title: testData.test.title,
        is_public: isPublic,
        is_complete: true,
        source_format: 'json',
        data: testData,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('tests')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error('[testService] Lỗi khi lưu đề lên Supabase:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi mạng khi lưu đề.' };
    }
  },

  /**
   * Xóa một đề thi theo mã code
   */
  deleteTest: async (code: string): Promise<{ success: boolean; error?: string }> => {
    // 1. Xóa khỏi cache cục bộ
    const list = testService.getAllTestsSync().filter((t) => t.test.code !== code);
    inMemoryTestsCache = list;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch {}

    // 2. Xóa trên Supabase
    if (!isSupabaseConfigured) return { success: true };

    try {
      const { error } = await supabase.from('tests').delete().eq('id', code);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Upload file media (Audio / Ảnh) vào private bucket 'test-media'
   * Đường dẫn: {owner_id}/{test_id}/{fileName}
   */
  uploadMediaToStorage: async (file: File, testCode: string): Promise<string> => {
    if (!isSupabaseConfigured) {
      return URL.createObjectURL(file);
    }

    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = user?.id || 'anonymous';
    const fileExt = file.name.split('.').pop() || 'dat';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `${ownerId}/${testCode}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('test-media')
      .upload(filePath, file, {
        cacheControl: '31536000',
        upsert: false,
      });

    if (error) {
      throw new Error(`Lỗi upload media: ${error.message}`);
    }

    // Tạo Signed URL có thời hạn (180 phút = 10800 giây)
    const { data: signedData, error: signError } = await supabase.storage
      .from('test-media')
      .createSignedUrl(data.path, 10800);

    if (signError || !signedData) {
      // Fallback lấy public URL nếu bucket cho phép
      const { data: pubData } = supabase.storage.from('test-media').getPublicUrl(data.path);
      return pubData.publicUrl;
    }

    return signedData.signedUrl;
  },

  /**
   * Xuất đề thi ra file JSON (Tải xuống máy người dùng)
   */
  exportTestAsJson: (testData: ExamData): void => {
    const jsonStr = JSON.stringify(testData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${testData.test.code || 'toeic_test'}_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Nhập đề thi từ nội dung JSON và lưu vào Supabase (owner_id = user hiện tại)
   */
  importTestFromJson: async (
    jsonString: string
  ): Promise<{ success: boolean; data?: ExamData; error?: string }> => {
    try {
      const raw = JSON.parse(jsonString) as Record<string, unknown>;

      // Trường hợp 1: Định dạng Part đơn lẻ { part: 1, passages: [...] }
      if (raw.part && Array.isArray(raw.passages)) {
        const partNum = Number(raw.part);
        const passages = raw.passages as Record<string, unknown>[];
        const convertedQuestions: ExamData['questions'] = [];
        const convertedPassages: ExamData['passages'] = [];

        for (const p of passages) {
          const passageId = String(p.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
          convertedPassages.push({
            id_ref: passageId,
            part_number: partNum,
            title: null,
            content: (p.text as string) || null,
            audio_url: (p.audioFile as string) || (p.audio_url as string) || null,
            image_url: (p.imageUrl as string) || (p.image_url as string) || null,
          });

          if (Array.isArray(p.questions)) {
            for (const q of p.questions as Record<string, unknown>[]) {
              const qNum = Number(q.id || convertedQuestions.length + 1);
              const rawOptions = (q.options as string[]) || [];
              const opts: import('../types/exam').Option[] = rawOptions.map((optStr, idx) => {
                const label = ['A', 'B', 'C', 'D'][idx] as import('../types/exam').OptionLabel;
                return {
                  option_label: label,
                  option_text: optStr,
                };
              });

              convertedQuestions.push({
                question_number: qNum,
                part_number: partNum,
                question_type: partNum <= 4 ? 'SHORT_TALK' : 'INCOMPLETE_SENTENCE',
                passage_id_ref: passageId,
                question_text: (q.question as string) || `Question ${qNum}`,
                options: opts,
                correct_option: (q.answer as import('../types/exam').OptionLabel) || 'A',
                explanation: (q.explanation as string) || null,
                transcript: null,
              });
            }
          }
        }

        const newExam: ExamData = {
          test: {
            title: `TOEIC Part ${partNum} Practice (${convertedQuestions.length} câu)`,
            code: `PART${partNum}_${Date.now().toString(36).toUpperCase()}`,
            description: `Đề thi luyện tập Part ${partNum} được import tự động`,
            duration_minutes: partNum <= 4 ? 45 : 75,
            total_questions: convertedQuestions.length,
          },
          parts: [
            {
              part_number: partNum,
              name: `Part ${partNum}`,
              directions_text: '',
              total_questions: convertedQuestions.length,
            },
          ],
          passages: convertedPassages,
          questions: convertedQuestions,
        };

        await testService.saveTest(newExam, false);
        return { success: true, data: newExam };
      }

      // Trường hợp 2: Định dạng đề trọn gói chuẩn ExamData
      if (raw.test && Array.isArray(raw.questions)) {
        const examObj = raw as unknown as ExamData;
        if (!examObj.test.code) {
          examObj.test.code = `TEST_${Date.now().toString(36).toUpperCase()}`;
        }

        await testService.saveTest(examObj, false);
        return { success: true, data: examObj };
      }

      return {
        success: false,
        error: 'Cấu trúc file JSON không đúng chuẩn đề thi TOEIC CBT.',
      };
    } catch (e: any) {
      return { success: false, error: e.message || 'Lỗi cú pháp JSON.' };
    }
  },

  /**
   * Tạo đề thi trắng
   */
  createEmptyTest: (): ExamData => {
    const code = `CUSTOM_${Date.now().toString(36).toUpperCase()}`;
    return {
      test: {
        title: 'Đề thi mới (Chưa đặt tên)',
        code,
        description: 'Mô tả bộ đề thi TOEIC CBT',
        duration_minutes: 120,
        total_questions: 0,
      },
      parts: [],
      passages: [],
      questions: [],
    };
  },

  /**
   * Xóa bộ nhớ đệm đề thi khi đăng xuất để đảm bảo tài khoản khác không thấy đề riêng tư
   */
  clearSessionCache: (): void => {
    inMemoryTestsCache = null;
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {}
  },
};

// Xuất biệt danh để tương thích 100% với code cũ gọi adminTestService
export const adminTestService = testService;
