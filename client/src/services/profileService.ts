import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile } from '../types/auth';

export const profileService = {
  /**
   * Lấy thông tin hồ sơ của người dùng từ Supabase profiles
   */
  getProfile: async (userId: string): Promise<UserProfile | null> => {
    if (!isSupabaseConfigured || !userId) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[profileService] Lỗi khi truy vấn profile:', error.message);
        return null;
      }

      return data as UserProfile | null;
    } catch (err) {
      console.error('[profileService] Ngoại lệ khi tải profile:', err);
      return null;
    }
  },

  /**
   * Cập nhật thông tin hồ sơ người dùng lên Supabase profiles
   */
  updateProfile: async (
    userId: string,
    updates: { full_name?: string; date_of_birth?: string; candidate_id?: string }
  ): Promise<{ success: boolean; data?: UserProfile; error?: string }> => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Chưa cấu hình Supabase.' };
    }

    try {
      const payload = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as UserProfile };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi kết nối khi cập nhật hồ sơ.' };
    }
  },
};
