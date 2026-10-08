import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthLoadingScreen } from './AuthLoadingScreen';
import { ForbiddenPage } from './ForbiddenPage';

export const REDIRECT_TARGET_KEY = 'toeic_redirect_after_login';

interface RequireAuthProps {
  children: React.ReactNode;
  currentPath?: string;
  onNavigateToLogin: (targetPath?: string) => void;
}

/**
 * Route Guard: Yêu cầu đăng nhập.
 * - Đang kiểm tra phiên: Hiển thị màn hình Loading (không nháy màn hình đăng nhập).
 * - Chưa đăng nhập: Lưu lại trang đích vào sessionStorage và chuyển đến /login.
 * - Đã đăng nhập: Cho phép hiển thị nội dung được bảo vệ.
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  currentPath,
  onNavigateToLogin,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const destination =
        currentPath ||
        window.location.pathname + window.location.search + window.location.hash;

      // Không lưu các trang đăng nhập/đăng ký làm trang đích
      if (
        destination &&
        !destination.includes('/login') &&
        !destination.includes('/register') &&
        !destination.includes('/forgot-password') &&
        !destination.includes('/reset-password')
      ) {
        sessionStorage.setItem(REDIRECT_TARGET_KEY, destination);
      }

      onNavigateToLogin(destination);
    }
  }, [isLoading, isAuthenticated, currentPath, onNavigateToLogin]);

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
};

interface RequireAdminProps {
  children: React.ReactNode;
  onBackToHome: () => void;
  onNavigateToLogin: (targetPath?: string) => void;
  onOpenProfile?: () => void;
}

/**
 * Route Guard: Yêu cầu quyền Quản trị viên (Admin).
 * - Chưa đăng nhập: Chuyển hướng về trang đăng nhập và nhớ URL /admin.
 * - Đã đăng nhập nhưng không phải admin: Hiển thị màn hình 403 Forbidden.
 * - Là admin: Cho phép vào trang quản trị đề.
 */
export const RequireAdmin: React.FC<RequireAdminProps> = ({
  children,
  onBackToHome,
  onNavigateToLogin,
  onOpenProfile,
}) => {
  const { isAuthenticated, isLoading, role } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      sessionStorage.setItem(REDIRECT_TARGET_KEY, '/admin');
      onNavigateToLogin('/admin');
    }
  }, [isLoading, isAuthenticated, onNavigateToLogin]);

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthLoadingScreen />;
  }

  if (role !== 'admin') {
    return <ForbiddenPage onBackToHome={onBackToHome} onOpenProfile={onOpenProfile} />;
  }

  return <>{children}</>;
};
