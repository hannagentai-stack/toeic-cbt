import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { ExamData } from '../types/exam';

export interface PreloadAudioItem {
  id: string;
  title: string;
  url: string;
  partNumber?: number;
  questionNumber?: number;
}

export interface PreloadProgress {
  currentItemTitle: string;
  loadedCount: number;
  totalCount: number;
  percentage: number;
  totalBytes: number;
  failedCount: number;
}

export interface PreloadResult {
  success: boolean;
  loadedCount: number;
  totalCount: number;
  totalBytes: number;
  failedItems: { item: PreloadAudioItem; error: string }[];
}

interface CachedSignedUrl {
  url: string;
  expiresAt: number; // Timestamp (ms)
}

interface CachedBlob {
  blobUrl: string;
  blob: Blob;
  size: number;
}

// Bộ nhớ đệm Signed URLs (hết hạn sau 2 giờ = 7200 giây)
const signedUrlsCache = new Map<string, CachedSignedUrl>();

// Bộ nhớ đệm âm thanh Blob URL trong RAM cho phiên thi (ngăn giật lag khi mạng chậm)
const audioSessionBlobCache = new Map<string, CachedBlob>();

// Thời hạn signed URL mặc định: 2 giờ (7200 giây)
const DEFAULT_SIGNED_URL_EXPIRY_SECONDS = 7200;
// Làm mới trước khi hết hạn 15 phút (900 giây)
const REFRESH_BUFFER_SECONDS = 900;

export const mediaService = {
  /**
   * Kiểm tra xem đường dẫn hoặc URL có thuộc Supabase Storage bucket 'test-media' không
   */
  isSupabaseStorageMedia: (urlOrPath: string): boolean => {
    if (!urlOrPath) return false;
    if (urlOrPath.startsWith('blob:') || urlOrPath.startsWith('data:')) return false;

    // Các dạng định danh Storage bucket:
    // 1. "test-media:path/to/file.mp3"
    // 2. "test-media/path/to/file.mp3"
    // 3. Đường dẫn tương đối dạng "user_id/test_code/file.mp3" (không có http://)
    // 4. URL Supabase Storage: https://.../storage/v1/object/.../test-media/...
    if (urlOrPath.startsWith('test-media:') || urlOrPath.startsWith('test-media/')) return true;
    if (urlOrPath.includes('/storage/v1/object/') && urlOrPath.includes('test-media')) return true;
    if (!urlOrPath.startsWith('http://') && !urlOrPath.startsWith('https://') && urlOrPath.includes('/')) return true;

    return false;
  },

  /**
   * Chuẩn hóa đường dẫn tương đối trong bucket 'test-media'
   */
  extractStoragePath: (urlOrPath: string): string => {
    if (urlOrPath.startsWith('test-media:')) {
      return urlOrPath.replace(/^test-media:/, '').replace(/^\/+/, '');
    }
    if (urlOrPath.startsWith('test-media/')) {
      return urlOrPath.replace(/^test-media\//, '').replace(/^\/+/, '');
    }
    if (urlOrPath.includes('/storage/v1/object/')) {
      // Phân tích url: .../storage/v1/object/(public|authenticated|sign)/test-media/{path}
      const match = urlOrPath.match(/\/storage\/v1\/object\/(?:public|authenticated|sign)\/test-media\/(.+?)(?:\?.*)?$/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
    return urlOrPath.replace(/^\/+/, '');
  },

  /**
   * Lấy Signed URL (hết hạn sau 2 giờ) cho file trong bucket riêng tư 'test-media'
   * Tự động làm mới khi sắp hết hạn (trong vòng 15 phút)
   */
  getSignedMediaUrl: async (
    urlOrPath: string,
    expiresInSeconds: number = DEFAULT_SIGNED_URL_EXPIRY_SECONDS
  ): Promise<string> => {
    if (!urlOrPath) return '';

    // Nếu đã là blob URL hoặc data URL thì trả về ngay
    if (urlOrPath.startsWith('blob:') || urlOrPath.startsWith('data:')) {
      return urlOrPath;
    }

    // Nếu không phải file trong Supabase Storage (ví dụ link CDN, GitHub raw), giữ nguyên
    if (!mediaService.isSupabaseStorageMedia(urlOrPath)) {
      return urlOrPath;
    }

    if (!isSupabaseConfigured) {
      return urlOrPath;
    }

    const cleanPath = mediaService.extractStoragePath(urlOrPath);
    const now = Date.now();

    // 1. Kiểm tra cache Signed URL còn hạn không (phải còn ít nhất 15 phút)
    const cached = signedUrlsCache.get(cleanPath);
    if (cached && cached.expiresAt - now > REFRESH_BUFFER_SECONDS * 1000) {
      return cached.url;
    }

    try {
      // 2. Sinh Signed URL mới từ Supabase Storage với thời hạn 2 giờ (7200s)
      const { data, error } = await supabase.storage
        .from('test-media')
        .createSignedUrl(cleanPath, expiresInSeconds);

      if (error || !data?.signedUrl) {
        console.warn(`[mediaService] Lỗi tạo Signed URL cho '${cleanPath}':`, error?.message);
        // Fallback sang public URL nếu có
        const { data: pubData } = supabase.storage.from('test-media').getPublicUrl(cleanPath);
        return pubData.publicUrl || urlOrPath;
      }

      // 3. Lưu vào cache kèm timestamp hết hạn
      signedUrlsCache.set(cleanPath, {
        url: data.signedUrl,
        expiresAt: now + expiresInSeconds * 1000,
      });

      return data.signedUrl;
    } catch (err) {
      console.error(`[mediaService] Ngoại lệ khi tạo signed URL cho '${cleanPath}':`, err);
      return urlOrPath;
    }
  },

  /**
   * Quét và làm mới các Signed URL sắp hết hạn trong phiên
   */
  refreshExpiringSignedUrls: async (expiresInSeconds: number = DEFAULT_SIGNED_URL_EXPIRY_SECONDS): Promise<void> => {
    const now = Date.now();
    const refreshThreshold = REFRESH_BUFFER_SECONDS * 1000;

    const pathsToRefresh: string[] = [];
    signedUrlsCache.forEach((entry, path) => {
      if (entry.expiresAt - now <= refreshThreshold) {
        pathsToRefresh.push(path);
      }
    });

    if (pathsToRefresh.length === 0) return;

    console.log(`[mediaService] Đang làm mới ${pathsToRefresh.length} signed URLs sắp hết hạn...`);
    for (const path of pathsToRefresh) {
      try {
        const { data } = await supabase.storage
          .from('test-media')
          .createSignedUrl(path, expiresInSeconds);

        if (data?.signedUrl) {
          signedUrlsCache.set(path, {
            url: data.signedUrl,
            expiresAt: now + expiresInSeconds * 1000,
          });
        }
      } catch (e) {
        console.warn(`[mediaService] Không thể làm mới signed url cho ${path}:`, e);
      }
    }
  },

  /**
   * Lấy URL phát audio tối ưu:
   * Ưu tiên 1: Blob URL đã preload sẵn trong RAM (0ms latency, không phụ thuộc mạng)
   * Ưu tiên 2: Signed URL từ Supabase Storage (hoặc URL gốc)
   */
  getPlayableAudioUrl: (urlOrPath: string): string => {
    if (!urlOrPath) return '';

    // 1. Kiểm tra bộ nhớ đệm blob URL
    const cachedBlob = audioSessionBlobCache.get(urlOrPath);
    if (cachedBlob) {
      return cachedBlob.blobUrl;
    }

    const cleanPath = mediaService.extractStoragePath(urlOrPath);
    const cachedBlobByPath = audioSessionBlobCache.get(cleanPath);
    if (cachedBlobByPath) {
      return cachedBlobByPath.blobUrl;
    }

    // 2. Kiểm tra Signed URL đã được cấp
    const cachedSigned = signedUrlsCache.get(cleanPath);
    if (cachedSigned) {
      return cachedSigned.url;
    }

    return urlOrPath;
  },

  /**
   * Kiểm tra xem một file audio đã được lưu trong bộ nhớ đệm RAM chưa
   */
  isAudioPreloaded: (urlOrPath: string): boolean => {
    if (!urlOrPath) return false;
    if (audioSessionBlobCache.has(urlOrPath)) return true;
    const cleanPath = mediaService.extractStoragePath(urlOrPath);
    return audioSessionBlobCache.has(cleanPath);
  },

  /**
   * Trích xuất toàn bộ danh sách file audio của phần Listening (Parts 1-4) cần preload
   */
  extractListeningAudioItems: (examData: ExamData): PreloadAudioItem[] => {
    const items: PreloadAudioItem[] = [];
    const seenUrls = new Set<string>();

    const addAudio = (
      url: string | null | undefined,
      title: string,
      partNumber?: number,
      questionNumber?: number
    ) => {
      if (!url || typeof url !== 'string' || url.trim() === '') return;
      const trimmed = url.trim();
      if (seenUrls.has(trimmed)) return;
      seenUrls.add(trimmed);

      items.push({
        id: `audio_${items.length + 1}_${trimmed.slice(-20).replace(/[^a-zA-Z0-9]/g, '_')}`,
        title,
        url: trimmed,
        partNumber,
        questionNumber,
      });
    };

    // 1. Audio toàn bài Listening (nếu có)
    if (examData.test.full_audio_url) {
      addAudio(examData.test.full_audio_url, 'Audio toàn bộ phần Listening (Full Track)', undefined, undefined);
    }

    // 2. Audio hướng dẫn các Part 1 - 4
    if (Array.isArray(examData.parts)) {
      examData.parts.forEach((p) => {
        if (p.part_number <= 4 && p.directions_audio_url) {
          addAudio(p.directions_audio_url, `Hướng dẫn Part ${p.part_number}`, p.part_number, undefined);
        }
      });
    }

    // 3. Audio các đoạn văn Part 1 - 4 (Passages)
    if (Array.isArray(examData.passages)) {
      examData.passages.forEach((p) => {
        if (p.part_number <= 4 && p.audio_url) {
          addAudio(p.audio_url, `Audio đoạn văn Part ${p.part_number}`, p.part_number, undefined);
        }
      });
    }

    // 4. Audio từng câu hỏi Part 1 - 4 (Questions)
    if (Array.isArray(examData.questions)) {
      examData.questions.forEach((q) => {
        if (q.part_number <= 4 && q.audio_url) {
          addAudio(q.audio_url, `Câu hỏi ${q.question_number} (Part ${q.part_number})`, q.part_number, q.question_number);
        }
      });
    }

    return items;
  },

  /**
   * Preload toàn bộ audio của phần thi Listening trước khi bắt đầu thi
   * - Tải về dạng Blob và lưu vào bộ nhớ trình duyệt (Blob URL)
   * - Báo cáo tiến trình (percentage, loadedCount, totalCount)
   * - Nếu lỗi tải thì ghi lại danh sách lỗi, cho phép thử lại
   */
  preloadListeningAudios: async (
    items: PreloadAudioItem[],
    onProgress?: (progress: PreloadProgress) => void,
    signal?: AbortSignal
  ): Promise<PreloadResult> => {
    const totalCount = items.length;
    if (totalCount === 0) {
      return {
        success: true,
        loadedCount: 0,
        totalCount: 0,
        totalBytes: 0,
        failedItems: [],
      };
    }

    let loadedCount = 0;
    let totalBytes = 0;
    const failedItems: { item: PreloadAudioItem; error: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      if (signal?.aborted) {
        break;
      }

      const item = items[i];

      // Báo tiến trình bắt đầu tải file hiện tại
      if (onProgress) {
        onProgress({
          currentItemTitle: item.title,
          loadedCount,
          totalCount,
          percentage: Math.round((loadedCount / totalCount) * 100),
          totalBytes,
          failedCount: failedItems.length,
        });
      }

      // Nếu đã cache trong phiên rồi thì bỏ qua
      if (mediaService.isAudioPreloaded(item.url)) {
        loadedCount++;
        const cached = audioSessionBlobCache.get(item.url) || audioSessionBlobCache.get(mediaService.extractStoragePath(item.url));
        if (cached) totalBytes += cached.size;
        continue;
      }

      try {
        // 1. Chuyển đổi sang Signed URL hợp lệ (nếu trong bucket riêng tư test-media)
        const fetchableUrl = await mediaService.getSignedMediaUrl(item.url, DEFAULT_SIGNED_URL_EXPIRY_SECONDS);

        // 2. Tải toàn bộ nội dung audio về máy
        const response = await fetch(fetchableUrl, { signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        // 3. Lưu vào RAM cache cho phiên thi
        const cleanPath = mediaService.extractStoragePath(item.url);
        const cachedEntry = { blobUrl, blob, size: blob.size };
        audioSessionBlobCache.set(item.url, cachedEntry);
        audioSessionBlobCache.set(cleanPath, cachedEntry);

        totalBytes += blob.size;
        loadedCount++;
      } catch (err: any) {
        if (signal?.aborted) return { success: false, loadedCount, totalCount, totalBytes, failedItems };
        console.warn(`[mediaService] Không thể tải audio '${item.title}':`, err);
        failedItems.push({
          item,
          error: err.message || 'Lỗi mạng khi tải file âm thanh',
        });
      }

      // Báo tiến trình sau khi tải xong file này
      if (onProgress) {
        onProgress({
          currentItemTitle: item.title,
          loadedCount,
          totalCount,
          percentage: Math.round((loadedCount / totalCount) * 100),
          totalBytes,
          failedCount: failedItems.length,
        });
      }
    }

    const success = failedItems.length === 0 && loadedCount === totalCount;
    return {
      success,
      loadedCount,
      totalCount,
      totalBytes,
      failedItems,
    };
  },

  /**
   * Xóa toàn bộ bộ nhớ đệm Blob URL khi kết thúc phiên thi để giải phóng RAM
   */
  clearAudioSessionCache: (): void => {
    audioSessionBlobCache.forEach((entry) => {
      try {
        URL.revokeObjectURL(entry.blobUrl);
      } catch {}
    });
    audioSessionBlobCache.clear();
    signedUrlsCache.clear();
  },
};
