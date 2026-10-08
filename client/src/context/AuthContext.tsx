import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { AuthContextType, UserProfile, UserRole } from '../types/auth';
import { translateAuthError } from '../utils/authErrorTranslator';
import { attemptService } from '../services/attemptService';
import { testService } from '../services/testService';
import { mediaService } from '../services/mediaService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Tải thông tin Profile từ bảng `profiles`
  const fetchProfile = useCallback(async (currentUser: User): Promise<UserProfile | null> => {
    if (!isSupabaseConfigured) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.warn('[AuthContext] Lỗi khi truy vấn profiles:', error.message);
      }

      if (data) {
        const loadedProfile: UserProfile = {
          ...data,
          email: currentUser.email,
        };
        setProfile(loadedProfile);
        return loadedProfile;
      }

      // Nếu chưa có row trong profiles (ví dụ vừa đăng ký hoặc OAuth), tự động khởi tạo fallback
      const fallbackProfile: UserProfile = {
        id: currentUser.id,
        full_name:
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.name ||
          currentUser.email?.split('@')[0] ||
          'Thí sinh',
        date_of_birth: currentUser.user_metadata?.date_of_birth || '',
        candidate_id:
          currentUser.user_metadata?.candidate_id ||
          `SBD-${currentUser.id.substring(0, 8).toUpperCase()}`,
        role: 'user' as UserRole, // Luôn mặc định là 'user', quyền admin chỉ được cấp bởi database RLS
        email: currentUser.email,
      };

      try {
        await supabase.from('profiles').upsert(fallbackProfile, { onConflict: 'id' });
      } catch (upsertErr) {
        console.warn('[AuthContext] Không thể upsert fallback profile:', upsertErr);
      }

      setProfile(fallbackProfile);
      return fallbackProfile;
    } catch (err) {
      console.error('[AuthContext] Ngoại lệ khi tải profile:', err);
      return null;
    }
  }, []);

  // Khởi tạo phiên làm việc ban đầu và lắng nghe thay đổi Auth
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        if (!isSupabaseConfigured) {
          setIsLoading(false);
          return;
        }

        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[AuthContext] Lỗi lấy session ban đầu:', error.message);
        }

        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user || null);
          if (initialSession?.user) {
            await fetchProfile(initialSession.user);
          }
        }
      } catch (err) {
        console.error('[AuthContext] Lỗi khởi tạo Auth:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    // Lắng nghe các sự kiện SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      const currentUser = newSession?.user || null;
      setUser(currentUser);

      if (event === 'SIGNED_OUT' || !currentUser) {
        setProfile(null);
        setIsLoading(false);
        attemptService.clearSessionCache();
        testService.clearSessionCache();
        mediaService.clearAudioSessionCache();
      } else if (currentUser) {
        await fetchProfile(currentUser);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Đăng nhập bằng Email và Mật khẩu
  const signInWithEmail = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: translateAuthError(error) };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user);
      }

      return {};
    } catch (err: any) {
      return { error: translateAuthError(err) };
    }
  };

  // Đăng ký tài khoản mới bằng Email
  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error?: string; needsEmailVerification?: boolean }> => {
    try {
      const trimmedEmail = email.trim();
      const trimmedName = fullName.trim();

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        return { error: translateAuthError(error) };
      }

      // Kiểm tra xem Supabase có yêu cầu xác nhận email không
      // Nếu session là null hoặc user.confirmed_at chưa có thì cần xác nhận email
      const needsEmailVerification = !data.session && Boolean(data.user);

      if (data.user && data.session) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user);
      }

      return { needsEmailVerification };
    } catch (err: any) {
      return { error: translateAuthError(err) };
    }
  };

  // Đăng nhập qua Google OAuth
  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        return { error: translateAuthError(error) };
      }

      return {};
    } catch (err: any) {
      return { error: translateAuthError(err) };
    }
  };

  // Đăng xuất tài khoản
  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[AuthContext] Lỗi khi đăng xuất:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);

      // Dọn sạch toàn bộ cache dữ liệu để cô lập hoàn toàn giữa các tài khoản
      attemptService.clearSessionCache();
      testService.clearSessionCache();
      mediaService.clearAudioSessionCache();

      try {
        localStorage.removeItem('toeic_cbt_answers');
        localStorage.removeItem('toeic_cbt_flags');
        sessionStorage.removeItem('toeic_cbt_remaining_seconds');
        sessionStorage.removeItem('toeic_cbt_elapsed_seconds');
        sessionStorage.removeItem('toeic_redirect_after_login');
      } catch {}
    }
  };

  // Quên mật khẩu: Gửi email đặt lại
  const resetPasswordForEmail = async (email: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: translateAuthError(error) };
      }

      return {};
    } catch (err: any) {
      return { error: translateAuthError(err) };
    }
  };

  // Cập nhật mật khẩu mới (trang /reset-password)
  const updatePassword = async (newPassword: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: translateAuthError(error) };
      }

      return {};
    } catch (err: any) {
      return { error: translateAuthError(err) };
    }
  };

  // Gửi lại email xác nhận đăng ký
  const resendVerificationEmail = async (email: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        return { error: translateAuthError(error) };
      }

      return {};
    } catch (err: any) {
      return { error: translateAuthError(err) };
    }
  };

  // Cập nhật hồ sơ cá nhân
  const updateProfile = async (
    data: { full_name?: string; date_of_birth?: string; candidate_id?: string }
  ): Promise<{ error?: string }> => {
    if (!user) return { error: 'Bạn chưa đăng nhập.' };

    try {
      const updates: {
        full_name?: string;
        date_of_birth?: string;
        candidate_id?: string;
        updated_at: string;
      } = {
        updated_at: new Date().toISOString(),
      };
      if (data.full_name !== undefined) updates.full_name = data.full_name.trim();
      if (data.date_of_birth !== undefined) updates.date_of_birth = data.date_of_birth.trim();
      if (data.candidate_id !== undefined) updates.candidate_id = data.candidate_id.trim();

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        return { error: error.message };
      }

      if (profile) {
        const nextProfile: UserProfile = {
          ...profile,
          ...(updates.full_name !== undefined ? { full_name: updates.full_name } : {}),
          ...(updates.date_of_birth !== undefined ? { date_of_birth: updates.date_of_birth } : {}),
          ...(updates.candidate_id !== undefined ? { candidate_id: updates.candidate_id } : {}),
          updated_at: updates.updated_at,
        };
        setProfile(nextProfile);

        // Tự động đồng bộ sang localStorage để các bước chuẩn bị thi sử dụng ngay
        try {
          localStorage.setItem(
            'toeic_saved_candidate',
            JSON.stringify({
              fullName: nextProfile.full_name,
              dateOfBirth: nextProfile.date_of_birth,
              candidateId: nextProfile.candidate_id,
              email: user.email,
            })
          );
        } catch {}
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'Lỗi khi cập nhật hồ sơ.' };
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (user) {
      await fetchProfile(user);
    }
  };

  const role: UserRole = profile?.role || 'user';
  const isAuthenticated = Boolean(user);
  const isAdmin = role === 'admin';

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      role,
      isLoading,
      isAuthenticated,
      isAdmin,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
      resetPasswordForEmail,
      updatePassword,
      resendVerificationEmail,
      updateProfile,
      refreshProfile,
    }),
    [user, session, profile, role, isLoading, isAuthenticated, isAdmin, fetchProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong một AuthProvider');
  }
  return context;
};
