import { useState, useEffect } from 'react';
import sampleExamData from './data/sample_mini_test.json';
import { ListeningExamModule } from './components/exam/listening/ListeningExamModule';
import { ReadingExamModule } from './components/exam/reading/ReadingExamModule';
import { ExamResultPage } from './components/exam/result/ExamResultPage';
import { ExamReviewPage } from './components/exam/review/ExamReviewPage';
import { CbtExamLayout } from './components/exam/cbt/CbtExamLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { HomePage } from './components/home/HomePage';
import { HistoryPage } from './components/history/HistoryPage';
import {
  PreparationWizard,
  validateSessionReady,
  type WizardStepId,
} from './components/preparation/PreparationWizard';
import type { ExamData, ExamMode, OptionLabel } from './types/exam';
import {
  Headphones,
  BookOpen,
  RefreshCw,
  Award,
  Search,
  Monitor,
  ShieldCheck,
  Home,
  Sliders,
  History,
} from 'lucide-react';
import { useListeningStore } from './store/useListeningStore';
import { useReadingStore } from './store/useReadingStore';
import { useExamSessionStore } from './store/useExamSessionStore';
import { calculateExamResult } from './utils/scoreCalculator';
import type { ExamScoreResult } from './utils/scoreCalculator';
import { attemptService, type SavedAttempt } from './services/attemptService';
import { adminTestService } from './services/adminTestService';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { UserMenu } from './components/auth/UserMenu';
import { useAuth } from './context/AuthContext';
import { RequireAuth, RequireAdmin, REDIRECT_TARGET_KEY } from './components/auth/RouteGuards';
import { ProfilePage } from './components/auth/ProfilePage';
import { ExamSessionWatchdog } from './components/auth/ExamSessionWatchdog';
import { LegacyDataMigrationModal } from './components/auth/LegacyDataMigrationModal';
import { ExamAudioPreloaderModal } from './components/exam/ExamAudioPreloaderModal';
import { mediaService } from './services/mediaService';
import { NotFoundPage } from './components/auth/NotFoundPage';

export type ActiveSection =
  | 'HOME'
  | 'PREP_WIZARD'
  | 'CBT_EXAM'
  | 'LISTENING'
  | 'READING'
  | 'RESULT'
  | 'REVIEW'
  | 'ADMIN'
  | 'HISTORY'
  | 'LOGIN'
  | 'REGISTER'
  | 'FORGOT_PASSWORD'
  | 'RESET_PASSWORD'
  | 'PROFILE'
  | 'NOT_FOUND';

export function App() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const [examData, setExamData] = useState<ExamData>(sampleExamData as unknown as ExamData);
  const [activeSection, setActiveSection] = useState<ActiveSection>(() => {
    try {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/login' || hash === '#/login' || hash === '#login') {
        return 'LOGIN';
      }
      if (path === '/register' || hash === '#/register' || hash === '#register') {
        return 'REGISTER';
      }
      if (path === '/forgot-password' || hash === '#/forgot-password' || hash === '#forgot-password') {
        return 'FORGOT_PASSWORD';
      }
      if (
        path === '/reset-password' ||
        hash === '#/reset-password' ||
        hash === '#reset-password' ||
        hash.includes('type=recovery')
      ) {
        return 'RESET_PASSWORD';
      }
      if (path === '/profile' || hash === '#/profile' || hash === '#profile') {
        return 'PROFILE';
      }
      if (
        path === '/admin' ||
        path === '/admin/import' ||
        hash === '#/admin' ||
        hash.startsWith('#/admin')
      ) {
        return 'ADMIN';
      }
      if (path === '/exam' || hash === '#/exam' || hash === '#exam') {
        return 'HOME'; // Sẽ kích hoạt attemptEnterExam qua handleUrlRoute
      }
      if (path === '/history' || hash === '#/history' || hash === '#history') {
        return 'HISTORY';
      }
      const saved = sessionStorage.getItem('toeic_active_section') as any;
      if (saved && saved !== 'LOGIN' && saved !== 'REGISTER') return saved;
    } catch {}
    return 'HOME';
  });

  // Tự động chuyển tiếp nếu người dùng đã đăng nhập nhưng giao diện vẫn đang hiển thị màn hình LOGIN
  useEffect(() => {
    console.log('[App] Trạng thái:', { activeSection, isAuthenticated, isLoading });
    if (!isLoading && isAuthenticated && activeSection === 'LOGIN') {
      console.log('[App] Đã đăng nhập nhưng đang ở LOGIN -> kích hoạt handleLoginSuccess');
      handleLoginSuccess();
    }
  }, [isLoading, isAuthenticated, activeSection]);

  useEffect(() => {
    try {
      sessionStorage.setItem('toeic_active_section', activeSection);
    } catch {}
  }, [activeSection]);
  const [wizardInitialStep, setWizardInitialStep] = useState<WizardStepId>('mode');
  const [scoreResult, setScoreResult] = useState<ExamScoreResult | null>(null);
  const [showAudioPreloader, setShowAudioPreloader] = useState(false);

  const listeningStore = useListeningStore();
  const readingStore = useReadingStore();

  // Điều hướng chuyển trang và đồng bộ URL thanh địa chỉ trình duyệt
  const navigateTo = (section: ActiveSection, urlPath?: string) => {
    setActiveSection(section);
    if (urlPath && window.location.pathname !== urlPath) {
      window.history.pushState(null, '', urlPath);
    }
  };

  // Route Guard: Kiểm tra phiên thi đã hoàn tất các bước cần thiết chưa
  const attemptEnterExam = () => {
    const { config } = useExamSessionStore.getState();
    const guard = validateSessionReady(config);

    if (!guard.isReady) {
      // Chuyển hướng trực tiếp về bước còn thiếu
      setWizardInitialStep(guard.missingStep || 'mode');
      setActiveSection('PREP_WIZARD');
      return;
    }

    handleStartExamFromWizard();
  };

  // Lắng nghe URL /exam, /history, /login, /register, /forgot-password, /reset-password hoặc hash để điều hướng
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/login' || hash === '#/login' || hash === '#login') {
        setActiveSection('LOGIN');
      } else if (path === '/register' || hash === '#/register' || hash === '#register') {
        setActiveSection('REGISTER');
      } else if (
        path === '/forgot-password' ||
        hash === '#/forgot-password' ||
        hash === '#forgot-password'
      ) {
        setActiveSection('FORGOT_PASSWORD');
      } else if (
        path === '/reset-password' ||
        hash === '#/reset-password' ||
        hash === '#reset-password' ||
        hash.includes('type=recovery')
      ) {
        setActiveSection('RESET_PASSWORD');
      } else if (path === '/profile' || hash === '#/profile' || hash === '#profile') {
        setActiveSection('PROFILE');
      } else if (
        path === '/admin' ||
        path === '/admin/import' ||
        hash === '#/admin' ||
        hash.startsWith('#/admin')
      ) {
        setActiveSection('ADMIN');
      } else if (path === '/exam' || hash === '#/exam' || hash === '#exam') {
        attemptEnterExam();
      } else if (path === '/history' || hash === '#/history' || hash === '#history') {
        setActiveSection('HISTORY');
      } else if (path === '/' || path === '' || hash === '' || hash === '#/' || hash === '#') {
        setActiveSection('HOME');
      } else {
        setActiveSection('NOT_FOUND');
      }
    };

    handleUrlRoute();
    window.addEventListener('hashchange', handleUrlRoute);
    window.addEventListener('popstate', handleUrlRoute);
    return () => {
      window.removeEventListener('hashchange', handleUrlRoute);
      window.removeEventListener('popstate', handleUrlRoute);
    };
  }, []);

  // Sau khi đăng nhập thành công: quay về trang đang định vào (saved redirect target)
  const handleLoginSuccess = () => {
    const intendedTarget = sessionStorage.getItem(REDIRECT_TARGET_KEY);
    if (intendedTarget) {
      sessionStorage.removeItem(REDIRECT_TARGET_KEY);
      if (intendedTarget === '/profile' || intendedTarget.startsWith('/profile')) {
        navigateTo('PROFILE', '/profile');
        return;
      }
      if (intendedTarget === '/admin' || intendedTarget.startsWith('/admin')) {
        navigateTo('ADMIN', '/admin');
        return;
      }
      if (intendedTarget === '/history' || intendedTarget.startsWith('/history')) {
        navigateTo('HISTORY', '/history');
        return;
      }
      if (intendedTarget === '/exam' || intendedTarget.startsWith('/exam')) {
        attemptEnterExam();
        return;
      }
    }
    navigateTo('HOME', '/');
  };

  // Bắt đầu luồng chuẩn bị thi từ Trang chủ
  const handleStartWizard = (mode: ExamMode) => {
    const store = useExamSessionStore.getState();
    store.setMode(mode);
    setWizardInitialStep('test');
    setActiveSection('PREP_WIZARD');
  };

  // Khởi động bài thi sau khi hoàn thành các bước chuẩn bị
  const handleStartExamFromWizard = () => {
    const { config, buildActiveExamData } = useExamSessionStore.getState();

    // 1. Tải đề thi được chọn từ ngân hàng đề admin hoặc file mẫu
    let baseExam = adminTestService.getTestByCode(config.testId);
    if (!baseExam) {
      baseExam = sampleExamData as unknown as ExamData;
    }

    // 2. Lọc đề thi theo chế độ (Full / Skill / Practice / Review-wrong)
    const configuredExam = buildActiveExamData(baseExam);
    setExamData(configuredExam);

    // 3. Xóa cache và reset trạng thái phòng thi
    listeningStore.resetExam();
    readingStore.resetReading();
    try {
      localStorage.removeItem('toeic_cbt_answers');
      localStorage.removeItem('toeic_cbt_flags');
    } catch {
      // ignore
    }
    setScoreResult(null);

    // 4. Kiểm tra xem có cần Preload Audio phần Listening không
    const listeningAudios = mediaService.extractListeningAudioItems(configuredExam);
    const hasUncached = listeningAudios.some((item) => !mediaService.isAudioPreloaded(item.url));

    if (listeningAudios.length > 0 && hasUncached) {
      setShowAudioPreloader(true);
      return;
    }

    // 5. Vào phòng thi CBT
    setActiveSection('CBT_EXAM');
  };

  // Xử lý nộp bài thi và tính toán điểm chuẩn ETS
  const handleFinishExam = (
    submittedAnswers?: Record<number, OptionLabel>,
    actualTimeSpentSeconds?: number
  ) => {
    const finalAnswers = submittedAnswers || {
      ...listeningStore.answers,
      ...readingStore.answers,
    };

    const listeningAnswers: Record<number, OptionLabel> = {};
    const readingAnswers: Record<number, OptionLabel> = {};

    examData.questions.forEach((q) => {
      const ans = finalAnswers[q.question_number];
      if (ans) {
        if (q.part_number <= 4) {
          listeningAnswers[q.question_number] = ans;
        } else {
          readingAnswers[q.question_number] = ans;
        }
      }
    });

    const totalTimeSpent =
      actualTimeSpentSeconds !== undefined
        ? actualTimeSpentSeconds
        : Math.max(60, 75 * 60 - readingStore.timeRemainingSeconds + 120);

    const result = calculateExamResult(
      examData,
      listeningAnswers,
      readingAnswers,
      Math.max(1, totalTimeSpent)
    );

    setScoreResult(result);

    const { config } = useExamSessionStore.getState();

    // Lưu vào lịch sử attempts với đầy đủ mode, skill, parts
    attemptService.saveAttempt(
      examData.test.code,
      examData.test.title,
      result,
      finalAnswers,
      config.mode,
      config.skill,
      config.parts,
      totalTimeSpent
    );

    // Xóa tiến độ làm dở vì đã nộp bài thành công
    attemptService.clearInProgressAttempt(examData.test.code);

    setActiveSection('RESULT');
  };

  // Tiếp tục làm bài thi đang dở
  const handleResumeInProgress = (inProgress: any) => {
    let baseExam = adminTestService.getTestByCode(inProgress.testId);
    if (!baseExam) {
      baseExam = sampleExamData as unknown as ExamData;
    }

    const sessionStore = useExamSessionStore.getState();
    if (inProgress.mode) {
      sessionStore.setMode(inProgress.mode);
    }
    sessionStore.setTest(inProgress.testId, inProgress.testTitle);
    if (inProgress.config?.skill) {
      sessionStore.setSkill(inProgress.config.skill);
    }
    if (inProgress.config?.parts) {
      sessionStore.setParts(inProgress.config.parts);
    }
    if (inProgress.config?.options) {
      sessionStore.setOptions(inProgress.config.options);
    }

    const configuredExam = sessionStore.buildActiveExamData(baseExam);
    setExamData(configuredExam);

    listeningStore.resetExam();
    readingStore.resetReading();

    try {
      localStorage.setItem('toeic_cbt_answers', JSON.stringify(inProgress.answers || {}));
      if (inProgress.config?.flaggedQuestions) {
        localStorage.setItem('toeic_cbt_flags', JSON.stringify(inProgress.config.flaggedQuestions));
      }
      if (inProgress.config?.remainingSeconds) {
        sessionStorage.setItem('toeic_cbt_remaining_seconds', String(inProgress.config.remainingSeconds));
      }
      if (inProgress.config?.elapsedSeconds) {
        sessionStorage.setItem('toeic_cbt_elapsed_seconds', String(inProgress.config.elapsedSeconds));
      }
    } catch {}

    Object.entries(inProgress.answers || {}).forEach(([qNumStr, opt]) => {
      const qNum = Number(qNumStr);
      if (qNum <= 100) listeningStore.selectAnswer(qNum, opt as OptionLabel);
      else readingStore.selectAnswer(qNum, opt as OptionLabel);
    });

    setScoreResult(null);

    // Kiểm tra xem có cần Preload Audio phần Listening không
    const listeningAudios = mediaService.extractListeningAudioItems(configuredExam);
    const hasUncached = listeningAudios.some((item) => !mediaService.isAudioPreloaded(item.url));

    if (listeningAudios.length > 0 && hasUncached) {
      setShowAudioPreloader(true);
      return;
    }

    setActiveSection('CBT_EXAM');
  };

  const handlePreloadComplete = () => {
    setShowAudioPreloader(false);
    setActiveSection('CBT_EXAM');
  };

  const handlePreloadCancel = () => {
    setShowAudioPreloader(false);
  };

  // Xem lại một lượt thi từ trang History
  const handleReviewAttempt = (attempt: SavedAttempt) => {
    let test = adminTestService.getTestByCode(attempt.testId);
    if (!test) {
      test = sampleExamData as unknown as ExamData;
    }
    setExamData(test);
    listeningStore.resetExam();
    readingStore.resetReading();
    Object.entries(attempt.answers).forEach(([qNumStr, opt]) => {
      const qNum = Number(qNumStr);
      if (qNum <= 100) listeningStore.selectAnswer(qNum, opt);
      else readingStore.selectAnswer(qNum, opt);
    });
    setScoreResult(attempt.scoreResult);
    setActiveSection('REVIEW');
  };

  const handleReset = () => {
    listeningStore.resetExam();
    readingStore.resetReading();
    setScoreResult(null);
    try {
      localStorage.removeItem('toeic_cbt_answers');
      localStorage.removeItem('toeic_cbt_flags');
    } catch {
      // ignore
    }
    setActiveSection('CBT_EXAM');
  };

  // Tính kết quả mặc định nếu người dùng nhảy thẳng vào xem Result
  const currentResult =
    scoreResult ||
    calculateExamResult(examData, listeningStore.answers, readingStore.answers, 900);

  // 0. CÁC TRANG XÁC THỰC CÔNG KHAI (PUBLIC AUTH PAGES - KHÔNG BỊ CHẶN)
  if (activeSection === 'LOGIN') {
    return (
      <LoginPage
        onNavigateToRegister={() => navigateTo('REGISTER', '/register')}
        onNavigateToForgotPassword={() => navigateTo('FORGOT_PASSWORD', '/forgot-password')}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (activeSection === 'REGISTER') {
    return (
      <RegisterPage
        onNavigateToLogin={() => navigateTo('LOGIN', '/login')}
        onRegisterSuccess={() => navigateTo('HOME', '/')}
      />
    );
  }

  if (activeSection === 'FORGOT_PASSWORD') {
    return (
      <ForgotPasswordPage
        onNavigateToLogin={() => navigateTo('LOGIN', '/login')}
      />
    );
  }

  if (activeSection === 'RESET_PASSWORD') {
    return (
      <ResetPasswordPage
        onResetSuccess={() => navigateTo('LOGIN', '/login')}
      />
    );
  }

  if (activeSection === 'NOT_FOUND') {
    return <NotFoundPage onBackToHome={() => navigateTo('HOME', '/')} />;
  }

  // TẤT CẢ CÁC TRANG CÒN LẠI ĐỀU BẮT BUỘC ĐĂNG NHẬP VỚI <RequireAuth>
  return (
    <RequireAuth onNavigateToLogin={() => navigateTo('LOGIN', '/login')}>
      {/* Hộp thoại chuyển dữ liệu cũ từ trình duyệt vào tài khoản Supabase */}
      <LegacyDataMigrationModal />

      {/* Modal Preload âm thanh trước khi vào phòng thi */}
      <ExamAudioPreloaderModal
        isOpen={showAudioPreloader}
        examData={examData}
        onComplete={handlePreloadComplete}
        onCancel={handlePreloadCancel}
      />

      {/* 1. TRANG HỒ SƠ THÍ SINH (/profile) */}
      {activeSection === 'PROFILE' && (
        <ProfilePage
          onBackToHome={() => navigateTo('HOME', '/')}
          onOpenHistory={() => navigateTo('HISTORY', '/history')}
          onStartExam={() => handleStartWizard('full')}
          onOpenAdmin={() => navigateTo('ADMIN', '/admin')}
        />
      )}

      {/* 2. TRANG QUẢN TRỊ ĐỀ THI (/admin & /admin/import) ĐƯỢC BẢO VỆ BỞI <RequireAdmin> */}
      {activeSection === 'ADMIN' && (
        <RequireAdmin
          onBackToHome={() => navigateTo('HOME', '/')}
          onNavigateToLogin={() => navigateTo('LOGIN', '/login')}
          onOpenProfile={() => navigateTo('PROFILE', '/profile')}
        >
          <AdminDashboard
            onBackToApp={() => navigateTo('HOME', '/')}
            onPreviewTest={(testData) => {
              setExamData(testData);
              handleReset();
              setActiveSection('CBT_EXAM');
            }}
          />
        </RequireAdmin>
      )}

      {/* 3. TRANG CHỦ (HOME PAGE) */}
      {activeSection === 'HOME' && (
        <HomePage
          onStartWizard={handleStartWizard}
          onOpenAdmin={() => navigateTo('ADMIN', '/admin')}
          onOpenReview={() => navigateTo('REVIEW')}
          onOpenHistory={() => navigateTo('HISTORY', '/history')}
          onOpenLogin={() => navigateTo('LOGIN', '/login')}
          onOpenRegister={() => navigateTo('REGISTER', '/register')}
          onResumeInProgress={handleResumeInProgress}
        />
      )}

      {/* 4. LUỒNG CHUẨN BỊ THI (PREPARATION WIZARD - 6 MÀN HÌNH ĐỘNG) */}
      {activeSection === 'PREP_WIZARD' && (
        <PreparationWizard
          initialStepId={wizardInitialStep}
          onBackToHome={() => navigateTo('HOME', '/')}
          onStartExam={handleStartExamFromWizard}
        />
      )}

      {/* 5. CÁC MÀN HÌNH THI, KẾT QUẢ VÀ LỊCH SỬ (CBT_EXAM, LISTENING, READING, RESULT, REVIEW, HISTORY) */}
      {!['PROFILE', 'ADMIN', 'HOME', 'PREP_WIZARD'].includes(activeSection) && (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
          {/* Giám sát phiên làm việc thời gian thực giữa bài thi - Tự động sao lưu nếu phiên hết hạn */}
          <ExamSessionWatchdog
            isExamActive={['CBT_EXAM', 'LISTENING', 'READING'].includes(activeSection)}
            currentTestCode={examData.test.code}
            currentSection={activeSection}
          />

          {/* Simulation Header */}
          <header className="bg-iig-navy text-white px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-iig-dark shadow-sm">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => navigateTo('HOME', '/')}
                className="w-8 h-8 rounded bg-iig-accent hover:bg-blue-600 flex items-center justify-center font-bold text-white tracking-wider text-sm shadow transition-colors cursor-pointer"
                title="Về Trang chủ"
              >
                IIG
              </button>
              <div>
                <h1 className="text-xs md:text-sm font-bold tracking-tight text-white flex items-center space-x-2">
                  <span>HỆ THỐNG THI THỬ TOEIC MÁY TÍNH (CBT SIMULATION)</span>
                </h1>
                <p className="text-[11px] text-slate-300 truncate max-w-xs sm:max-w-md">
                  {examData.test.title} • Format chuẩn IIG Việt Nam
                </p>
              </div>
            </div>

            {/* Thanh chuyển đổi nhanh các module phục vụ kiểm thử */}
            <div className="flex items-center space-x-2">
              <div className="bg-slate-800/80 p-1 rounded-lg border border-slate-700 flex items-center text-xs">
                <button
                  type="button"
                  onClick={() => navigateTo('HOME', '/')}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-md font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Về trang chủ"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Trang chủ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWizardInitialStep('mode');
                    navigateTo('PREP_WIZARD');
                  }}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Chuẩn bị thi"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đổi đề & Chế độ</span>
                </button>
                <button
                  type="button"
                  onClick={attemptEnterExam}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    activeSection === 'CBT_EXAM'
                      ? 'bg-iig-accent text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Phòng thi CBT</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('LISTENING')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md font-semibold transition-all hidden md:flex cursor-pointer ${
                    activeSection === 'LISTENING'
                      ? 'bg-iig-accent text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Listening</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('READING')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md font-semibold transition-all hidden md:flex cursor-pointer ${
                    activeSection === 'READING'
                      ? 'bg-iig-accent text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Reading</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!scoreResult) {
                      handleFinishExam();
                    } else {
                      setActiveSection('RESULT');
                    }
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    activeSection === 'RESULT'
                      ? 'bg-iig-accent text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Kết quả</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('REVIEW')}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    activeSection === 'REVIEW'
                      ? 'bg-iig-accent text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Review</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('HISTORY', '/history')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    activeSection === 'HISTORY'
                      ? 'bg-iig-accent text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Xem lịch sử bài thi và luyện tập"
                >
                  <History className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lịch sử</span>
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => navigateTo('ADMIN', '/admin')}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md font-semibold text-amber-300 hover:text-amber-200 hover:bg-slate-700/60 transition-all border border-amber-500/30 ml-1 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Admin Đề</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleReset}
                title="Làm lại từ đầu"
                className="flex items-center space-x-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg transition-colors border border-slate-700 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <UserMenu
                onOpenLogin={() => navigateTo('LOGIN', '/login')}
                onOpenRegister={() => navigateTo('REGISTER', '/register')}
                onOpenAdmin={() => navigateTo('ADMIN', '/admin')}
                onOpenHistory={() => navigateTo('HISTORY', '/history')}
                onOpenProfile={() => navigateTo('PROFILE', '/profile')}
              />
            </div>
          </header>

          {/* 1. MÀN HÌNH THI MÁY CHUẨN IIG CBT (GIAO DIỆN TỐI GIẢN) */}
          {activeSection === 'CBT_EXAM' && (
            <CbtExamLayout examData={examData} onFinishExam={handleFinishExam} />
          )}

          {/* 2. Phần thi LISTENING CHUYÊN SÂU */}
          {activeSection === 'LISTENING' && (
            <ListeningExamModule
              examData={examData}
              onListeningComplete={() => setActiveSection('READING')}
            />
          )}

          {/* 3. Phần thi READING CHUYÊN SÂU */}
          {activeSection === 'READING' && (
            <ReadingExamModule examData={examData} onSubmitExam={handleFinishExam} />
          )}

          {/* 4. BẢNG KẾT QUẢ VÀ BIỂU ĐỒ */}
          {activeSection === 'RESULT' && (
            <ExamResultPage
              scoreResult={currentResult}
              testTitle={examData.test.title}
              onReviewExam={() => setActiveSection('REVIEW')}
              onRetakeExam={() => {
                setWizardInitialStep('mode');
                setActiveSection('PREP_WIZARD');
              }}
            />
          )}

          {/* 5. XEM LẠI TỪNG CÂU (TRANSCRIPT, GIẢI THÍCH, NGHE LẠI AUDIO) */}
          {activeSection === 'REVIEW' && (
            <ExamReviewPage
              examData={examData}
              answers={{ ...listeningStore.answers, ...readingStore.answers }}
              onBackToResult={() => setActiveSection('RESULT')}
            />
          )}

          {/* 6. TRANG LỊCH SỬ THI VÀ LUYỆN TẬP (/history) */}
          {activeSection === 'HISTORY' && (
            <HistoryPage
              onBackToHome={() => navigateTo('HOME', '/')}
              onStartExam={(mode) => {
                if (mode) handleStartWizard(mode);
                else {
                  setWizardInitialStep('mode');
                  setActiveSection('PREP_WIZARD');
                }
              }}
              onReviewAttempt={handleReviewAttempt}
            />
          )}
        </div>
      )}
    </RequireAuth>
  );
}

export default App;
