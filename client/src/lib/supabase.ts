import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const envObject = (globalThis as any)?.process?.env || {};

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  envObject.VITE_SUPABASE_URL ||
  'https://placeholder.supabase.co';
const supabaseAnonKey =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY)) ||
  envObject.VITE_SUPABASE_ANON_KEY ||
  envObject.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'placeholder';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder')
);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

console.log('[Supabase Client] Khởi tạo:', {
  configured: isSupabaseConfigured,
  detectSessionInUrl: true,
  flowType: 'pkce',
});

/**
 * Upload file lên Supabase Storage bucket ('toeic-audio', 'toeic-images' hoặc 'test-media')
 * Tự động chuyển đổi sang CDN public URL
 */
export async function uploadMediaToSupabase(
  file: File,
  bucketName: 'toeic-audio' | 'toeic-images' | 'test-media'
): Promise<string> {
  if (!isSupabaseConfigured) {
    console.warn('[Supabase Storage] Chưa cấu hình VITE_SUPABASE_URL. Sử dụng Local Blob URL tạm thời.');
    return URL.createObjectURL(file);
  }

  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || 'anonymous';
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  
  // Đảm bảo đường dẫn tuân thủ Storage RLS: {userId}/{fileName}
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '31536000', // Cache CDN 1 năm
      upsert: false,
    });

  if (error) {
    throw new Error(`Lỗi upload lên Supabase Storage: ${error.message}`);
  }

  // Đối với bucket riêng tư 'test-media', trả về đường dẫn có namespace để mediaService xử lý Signed URL
  if (bucketName === 'test-media') {
    return `test-media:${data.path}`;
  }

  // Lấy link CDN công khai (Public URL) cho các bucket công khai
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}
