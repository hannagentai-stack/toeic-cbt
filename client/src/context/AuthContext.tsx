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
      console.log('[Auth] Đang tải profile cho user:', currentUser.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.warn('[Auth] Lỗi khi truy vấn profiles:', error.message);
      }

      if (data) {
        const loadedProfile: UserProfile = {
          ...data,
          email: currentUser.email,
        };
        console.log('[Auth] Profile tải thành công:', {
          id: loadedProfile.id,
          fullName: loadedProfile.full_name,
          role: loadedProfile.role,
        });
        setProfile(loadedProfile);
        return loadedProfile;
      }

      // Nếu chưa có row trong profiles (ví dụ vừa đăng ký Google OAuth), tự động khởi tạo fallback
      const fallbackName =
        currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.name ||
        currentUser.email?.split('@')[0] ||
        'Thí sinh';

      const fallbackProfile: UserProfile = {
        id: currentUser.id,
        full_name: fallbackName,
        date_of_birth: currentUser.user_metadata?.date_of_birth || '',
        candidate_id:
          currentUser.user_metadata?.candidate_id ||
          `SBD-${currentUser.id.substring(0, 8).toUpperCase()}`,
        role: 'user' as UserRole, // Luôn mặc định là 'user'
        email: currentUser.email,
      };

      console.log('[Auth] Chưa có profile trong DB, dùng fallback profile:', {
        id: fallbackProfile.id,
        fullName: fallbackProfile.full_name,
        role: fallbackProfile.role,
      });

      // Thử lưu profile dự phòng vào database (LƯU Ý: bảng profiles không có cột email)
      try {
        const dbPayload = {
          id: fallbackProfile.id,
          full_name: fallbackProfile.full_name,
          date_of_birth: fallbackProfile.date_of_birth,
          candidate_id: fallbackProfile.candidate_id,
          role: fallbackProfile.role,
        };
        const { error: upsertErr } = await supabase
          .from('profiles')
          .upsert(dbPayload, { onConflict: 'id' });
        if (upsertErr) {
          console.warn('[Auth] Lỗi khi upsert fallback profile vào DB:', upsertErr.message);
        }
      } catch (upsertErr) {
        console.warn('[Auth] Ngoại lệ khi upsert fallback profile:', upsertErr);
      }

      setProfile(fallbackProfile);
      return fallbackProfile;
    } catch (err) {
      console.error('[Auth] Ngoại lệ khi tải profile:', err);
      // Ngay cả khi lỗi, tạo tạm profile trong bộ nhớ để không chặn người dùng
      const memoryProfile: UserProfile = {
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || 'Thí sinh',
        date_of_birth: '',
        candidate_id: `SBD-${currentUser.id.substring(0, 8).toUpperCase()}`,
        role: 'user',
        email: currentUser.email,
      };
      setProfile(memoryProfile);
      return memoryProfile;
    }
  }, []);

  // Khởi tạo phiên làm việc ban đầu và lắng nghe thay đổi Auth
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        if (!isSupabaseConfigured) {
          console.log('[Auth] Supabase chưa được cấu hình');
          setIsLoading(false);
          return;
        }

        // 1. Kiểm tra xem URL có chứa lỗi OAuth không (error, error_description)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(
          window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
        );
        const oauthError = urlParams.get('error') || hashParams.get('error');
        const oauthErrorDesc = urlParams.get('error_description') || hashParams.get('error_description');

        if (oauthError) {
          console.warn('[Auth] Nhận thông báo lỗi OAuth từ URL:', oauthError, oauthErrorDesc);
          sessionStorage.setItem('toeic_oauth_error', oauthErrorDesc || oauthError);
          // Làm sạch URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        // 2. Kiểm tra mã auth code (PKCE) từ URL
        const authCode = urlParams.get('code');
        let initialSession: Session | null = null;

        if (authCode) {
          console.log('[Auth] Phát hiện auth code trong URL, đang trao đổi code lấy session...');
          try {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
            if (exchangeError) {
              console.warn('[Auth] Lỗi exchangeCodeForSession:', exchangeError.message);
              // Thử lấy session qua getSession xem detectSessionInUrl đã xử lý chưa
              const { data: sessionData } = await supabase.auth.getSession();
              initialSession = sessionData.session;
            } else {
              console.log('[Auth] Trao đổi code lấy session thành công');
              initialSession = data.session;
            }
          } catch (codeErr) {
            console.warn('[Auth] Ngoại lệ khi trao đổi code:', codeErr);
            const { data: sessionData } = await supabase.auth.getSession();
            initialSession = sessionData.session;
          }
          // Xóa param code trên thanh địa chỉ URL để tránh lặp lại
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          const { data: { session: existingSession }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('[Auth] Lỗi lấy session ban đầu:', error.message);
          }
          initialSession = existingSession;
        }

        console.log('[Auth] Trạng thái session ban đầu:', initialSession ? `Đã có session (${initialSession.user.email})` : 'Chưa có session');

        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user || null);
          if (initialSession?.user) {
            await fetchProfile(initialSession.user);
          }
        }
      } catch (err) {
        console.error('[Auth] Lỗi khởi tạo Auth:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          console.log('[Auth] Hoàn tất khởi tạo Auth, kết thúc loading');
        }
      }
    }

    initializeAuth();

    // Lắng nghe các sự kiện SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[Auth] onAuthStateChange event:', event, 'user:', newSession?.user?.email || 'null');
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
      const redirectUri = `${window.location.origin}/`;
      console.log('[Auth] Bắt đầu signInWithOAuth Google với redirectTo:', redirectUri);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
        },
      });

      if (error) {
        console.warn('[Auth] signInWithOAuth báo lỗi:', error.message);
        return { error: translateAuthError(error) };
      }

      return {};
    } catch (err: any) {
      console.error('[Auth] Ngoại lệ khi signInWithGoogle:', err);
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
