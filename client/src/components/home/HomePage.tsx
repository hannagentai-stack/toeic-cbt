import React, { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
  Headphones,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Sliders,
  ChevronRight,
  History,
  Play,
} from 'lucide-react';
import type { ExamMode } from '../../types/session';
import { attemptService } from '../../services/attemptService';
import { UserMenu } from '../auth/UserMenu';
import { useAuth } from '../../context/AuthContext';
import { LegalModal, type LegalDocType } from '../auth/LegalModal';

interface HomePageProps {
  onStartWizard: (mode: ExamMode) => void;
  onOpenAdmin: () => void;
  onOpenReview: () => void;
  onOpenHistory?: () => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
  onResumeInProgress?: (inProgress: any) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onStartWizard,
  onOpenAdmin,
  onOpenReview,
  onOpenHistory,
  onOpenLogin,
  onOpenRegister,
  onResumeInProgress,
}) => {
  const { isAdmin } = useAuth();
  const [latestAttempt, setLatestAttempt] = useState(() => attemptService.getLatestAttempt());
  const [allAttempts, setAllAttempts] = useState(() => attemptService.getAllAttemptsSync());
  const [inProgressAttempt, setInProgressAttempt] = useState<any>(null);
  const [legalModalState, setLegalModalState] = useState<{ isOpen: boolean; type: LegalDocType }>({
    isOpen: false,
    type: 'disclaimer',
  });

  useEffect(() => {
    let isMounted = true;
    attemptService.getInProgressAttempt().then((attempt) => {
      if (isMounted && attempt && Object.keys(attempt.answers || {}).length > 0) {
        setInProgressAttempt(attempt);
      }
    });

    attemptService.getAllAttemptsAsync().then((attempts) => {
      if (isMounted && attempts.length > 0) {
        setAllAttempts(attempts);
        setLatestAttempt(attempts[0]);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleResume = () => {
    if (inProgressAttempt && onResumeInProgress) {
      onResumeInProgress(inProgressAttempt);
    }
  };

  const handleDiscard = async () => {
    if (inProgressAttempt) {
      await attemptService.clearInProgressAttempt(inProgressAttempt.testId);
      setInProgressAttempt(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/20">
              IIG
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-white text-base tracking-tight">
                  TOEIC® CBT
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  VIETNAM OFFICIAL SIMULATION
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Hệ thống thi thử TOEIC trên máy vi tính chuẩn hóa
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs font-semibold">
            {onOpenHistory && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
                title="Xem lịch sử bài thi và luyện tập"
              >
                <History className="w-4 h-4 text-sky-400" />
                <span>Lịch sử ({allAttempts.length})</span>
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="hidden md:flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Ngân hàng đề (Admin)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onStartWizard('full')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md shadow-blue-600/30 hover:scale-105 active:scale-95 cursor-pointer"
            >
              Vào thi ngay
            </button>
            <UserMenu
              onOpenLogin={onOpenLogin}
              onOpenRegister={onOpenRegister}
              onOpenAdmin={onOpenAdmin}
              onOpenHistory={onOpenHistory}
            />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-20 border-b border-slate-800">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-blue-300 text-xs font-bold tracking-wide mb-6">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>CHUẨN FORMAT THI MÁY ETS & IIG VIỆT NAM 2024 - 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Trải nghiệm thi thử TOEIC CBT{' '}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-teal-300 bg-clip-text text-transparent">
              chân thực 100%
            </span>{' '}
            như phòng thi thật
          </h1>

          <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Hệ thống mô phỏng trọn vẹn quy trình thi trên máy: Kiểm tra âm thanh, Thẻ thí sinh, Phím tắt A/B/C/D, Ghim đoạn văn Part 7 và Chấm điểm điện tử thang 10 - 990.
          </p>

          {/* Quick Metrics */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-2xl backdrop-blur-sm">
              <div className="text-2xl font-black text-blue-400">200 Câu</div>
              <div className="text-xs text-slate-400 mt-0.5">Listening & Reading</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-2xl backdrop-blur-sm">
              <div className="text-2xl font-black text-amber-400">120 Phút</div>
              <div className="text-xs text-slate-400 mt-0.5">Đồng hồ đếm chuẩn ETS</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-2xl backdrop-blur-sm">
              <div className="text-2xl font-black text-emerald-400">990 Điểm</div>
              <div className="text-xs text-slate-400 mt-0.5">Thang điểm quy đổi chuẩn</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-2xl backdrop-blur-sm">
              <div className="text-2xl font-black text-purple-400">100% Lưu</div>
              <div className="text-xs text-slate-400 mt-0.5">Tự động chống mất điện</div>
            </div>
          </div>
        </div>
      </section>

      {/* Banner Tiếp tục bài đang làm dở (Nếu có) */}
      {inProgressAttempt && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-4 relative z-20">
          <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-2 border-amber-500/60 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Play className="w-6 h-6 fill-amber-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    Tiếp tục bài đang làm
                  </span>
                  <span className="text-[11px] text-slate-400">
                    • Chế độ: {inProgressAttempt.mode?.toUpperCase() || 'FULL'}
                  </span>
                </div>
                <h3 className="font-bold text-white text-base mt-0.5">
                  {inProgressAttempt.testTitle}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Đã làm <strong className="text-amber-400 font-bold">{Object.keys(inProgressAttempt.answers).length}</strong> câu
                  {inProgressAttempt.timeSpentSeconds ? ` • Thời gian đã làm: ${Math.round(inProgressAttempt.timeSpentSeconds / 60)} phút` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleDiscard}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              >
                Hủy bài này
              </button>
              <button
                type="button"
                onClick={handleResume}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Tiếp tục làm bài</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Recent Attempt Banner (Nếu đã có lần thi trước) */}
      {latestAttempt && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
          <div className="bg-gradient-to-r from-slate-800 via-slate-800/90 to-blue-950/80 border border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <History className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Lần thi gần nhất</span>
                  <span className="text-[11px] text-slate-400">
                    • {new Date(latestAttempt.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <h3 className="font-bold text-white text-base truncate max-w-md">
                  {latestAttempt.testTitle}
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Listening</div>
                  <div className="text-base font-black text-blue-400">
                    {latestAttempt.scoreResult.listeningScaledScore}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Reading</div>
                  <div className="text-base font-black text-teal-400">
                    {latestAttempt.scoreResult.readingScaledScore}
                  </div>
                </div>
                <div className="text-center pl-2 border-l border-slate-700">
                  <div className="text-[10px] uppercase font-bold text-amber-400">Tổng điểm</div>
                  <div className="text-xl font-black text-amber-300">
                    {latestAttempt.scoreResult.totalScore}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onOpenReview}
                  className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-200 transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <span>Xem lại câu hỏi</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                {onOpenHistory && (
                  <button
                    type="button"
                    onClick={onOpenHistory}
                    className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-xs font-bold text-blue-300 border border-blue-500/30 transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-blue-400" />
                    <span>Tất cả lịch sử</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main 4 Modes Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex-1">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Chọn chế độ thi & luyện tập
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Hệ thống hỗ trợ 4 chế độ linh hoạt, từ thi thử áp lực thật đến luyện chuyên sâu từng kỹ năng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Thi thử đầy đủ */}
          <div className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/60 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Layers className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Chuẩn IIG 100%
                </span>
              </div>
              <h3 className="text-lg font-black text-white group-hover:text-blue-300 transition-colors">
                1. Thi thử đầy đủ
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Listening + Reading (120 phút). Mô phỏng chuẩn xác từ thời gian, thứ tự đến âm thanh và giao diện thi thật.
              </p>

              <div className="mt-5 space-y-2 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>120 phút • 200 câu hỏi</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Thang điểm 10 - 990 ETS</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => onStartWizard('full')}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-600/30"
              >
                <span>Bắt đầu thi thử</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Thi theo kỹ năng */}
          <div className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/60 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/10">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-600/20 text-teal-400 border border-teal-500/30 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
                  <Headphones className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Tập trung
                </span>
              </div>
              <h3 className="text-lg font-black text-white group-hover:text-teal-300 transition-colors">
                2. Thi theo kỹ năng
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Chọn riêng Listening (45 phút) hoặc Reading (75 phút). Tính điểm thang 5 - 495 tương ứng.
              </p>

              <div className="mt-5 space-y-2 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <Headphones className="w-3.5 h-3.5 text-teal-400" />
                  <span>Listening: 45 phút (100 câu)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                  <span>Reading: 75 phút (100 câu)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => onStartWizard('skill')}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-teal-600/30"
              >
                <span>Chọn kỹ năng thi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3. Luyện theo Part */}
          <div className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/60 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Sliders className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Linh hoạt
                </span>
              </div>
              <h3 className="text-lg font-black text-white group-hover:text-indigo-300 transition-colors">
                3. Luyện theo Part
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Tự do chọn 1 hoặc nhiều Part (Part 1 - 7). Cho phép xem giải thích tức thì và nghe lại audio thoải mái.
              </p>

              <div className="mt-5 space-y-2 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Chọn tự do Part 1 đến 7</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Giải thích ngay & Tự chỉnh giờ</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => onStartWizard('practice')}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-indigo-600/30"
              >
                <span>Chọn Part luyện tập</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4. Ôn lại câu sai */}
          <div className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-rose-500/60 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/10">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Hiệu quả cao
                </span>
              </div>
              <h3 className="text-lg font-black text-white group-hover:text-rose-300 transition-colors">
                4. Ôn lại câu sai
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Tự động gom lại các câu bạn đã làm sai từ các bài thi trước để rèn luyện lặp lại đến khi thành thạo.
              </p>

              <div className="mt-5 space-y-2 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                  <span>Tránh lặp lại lỗi sai tương tự</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lịch sử: {allAttempts.length} bài thi đã lưu</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => onStartWizard('review-wrong')}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-rose-600/30"
              >
                <span>Ôn lại câu sai</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="border-t border-slate-800 bg-slate-900/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto sm:mx-0">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Giao diện CBT nguyên bản</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tái hiện chân thực thanh công cụ IIG, đồng hồ đếm ngược, phân chia Part 7 dạng 2 cột và bảng câu hỏi tương tác.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto sm:mx-0">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Thao tác phím tắt tối ưu</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bấm A/B/C/D để chọn đáp án tức thì, phím N/P để chuyển câu, F để cắm cờ xem lại mà không cần nhấc chuột.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto sm:mx-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Tự động sao lưu an toàn</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mọi thao tác chọn câu trả lời đều được lưu ngay vào trình duyệt. Bạn có thể F5 hoặc đổi máy mà không sợ mất bài.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500 space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-400">
          <button
            type="button"
            onClick={() => setLegalModalState({ isOpen: true, type: 'disclaimer' })}
            className="hover:text-sky-400 transition-colors cursor-pointer"
          >
            Tuyên bố miễn trừ trách nhiệm
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setLegalModalState({ isOpen: true, type: 'terms' })}
            className="hover:text-sky-400 transition-colors cursor-pointer"
          >
            Điều khoản sử dụng
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setLegalModalState({ isOpen: true, type: 'privacy' })}
            className="hover:text-sky-400 transition-colors cursor-pointer"
          >
            Chính sách quyền riêng tư
          </button>
        </div>

        <p className="max-w-2xl mx-auto px-4 text-[11px] leading-relaxed text-slate-500">
          TOEIC® là nhãn hiệu đã đăng ký của Viện Khảo thí Giáo dục Hoa Kỳ (ETS). Trang web này là hệ thống học tập mô phỏng phi thương mại, không có bất kỳ liên kết hoặc ủy quyền nào từ ETS hoặc IIG Việt Nam. Điểm số thi thử chỉ mang tính chất ước lượng tham khảo.
        </p>
        <p className="text-[10px] text-slate-600">
          Khuyến nghị: Thí sinh nên sử dụng máy tính (độ phân giải tối thiểu 1366x768) và tai nghe để trải nghiệm thi CBT chân thực nhất.
        </p>
      </footer>

      {/* Modal Pháp lý & Chính sách riêng tư */}
      <LegalModal
        isOpen={legalModalState.isOpen}
        type={legalModalState.type}
        onClose={() => setLegalModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
