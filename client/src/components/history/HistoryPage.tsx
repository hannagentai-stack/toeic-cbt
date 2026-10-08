import React, { useState, useMemo } from 'react';
import {
  History,
  Award,
  CheckCircle2,
  Search,
  Trash2,
  ArrowRight,
  ChevronRight,
  Headphones,
  BookOpen,
  Sliders,
  RotateCcw,
  Home,
  PlusCircle,
} from 'lucide-react';
import { attemptService, type SavedAttempt } from '../../services/attemptService';
import type { ExamMode } from '../../types/session';

interface HistoryPageProps {
  onBackToHome: () => void;
  onStartExam: (mode?: ExamMode) => void;
  onReviewAttempt: (attempt: SavedAttempt) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onBackToHome,
  onStartExam,
  onReviewAttempt,
}) => {
  const [allAttempts, setAllAttempts] = useState<SavedAttempt[]>(() =>
    attemptService.getAllAttempts()
  );
  const [selectedFilter, setSelectedFilter] = useState<ExamMode | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const refreshAttempts = () => {
    setAllAttempts(attemptService.getAllAttempts());
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc muốn xóa bản ghi lần thi này khỏi lịch sử không?')) {
      attemptService.deleteAttempt(id);
      refreshAttempts();
    }
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        'Bạn có chắc chắn muốn xóa TOÀN BỘ lịch sử thi? Hành động này không thể hoàn tác!'
      )
    ) {
      attemptService.clearHistory();
      refreshAttempts();
    }
  };

  // Đếm số lượng attempt theo từng chế độ
  const counts = useMemo(() => {
    return {
      all: allAttempts.length,
      full: allAttempts.filter((a) => (a.mode || 'full') === 'full').length,
      skill: allAttempts.filter((a) => a.mode === 'skill').length,
      practice: allAttempts.filter((a) => a.mode === 'practice').length,
      'review-wrong': allAttempts.filter((a) => a.mode === 'review-wrong').length,
    };
  }, [allAttempts]);

  // Lọc danh sách attempts
  const filteredAttempts = useMemo(() => {
    return allAttempts.filter((att) => {
      const modeMatch = selectedFilter === 'all' || (att.mode || 'full') === selectedFilter;
      const titleMatch =
        !searchQuery ||
        att.testTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        att.testId.toLowerCase().includes(searchQuery.toLowerCase());
      return modeMatch && titleMatch;
    });
  }, [allAttempts, selectedFilter, searchQuery]);

  // Tính các chỉ số tổng quan
  const stats = useMemo(() => {
    if (allAttempts.length === 0) return { total: 0, bestScore: 0, avgAccuracy: 0 };

    const total = allAttempts.length;
    const scoredAttempts = allAttempts.filter((a) => (a.mode || 'full') === 'full');
    const bestScore =
      scoredAttempts.length > 0
        ? Math.max(...scoredAttempts.map((a) => a.scoreResult.totalScore))
        : 0;

    const avgAccuracy = Math.round(
      allAttempts.reduce((sum, a) => sum + (a.scoreResult.overallAccuracy || 0), 0) / total
    );

    return { total, bestScore, avgAccuracy };
  }, [allAttempts]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              IIG
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-white text-base tracking-tight">
                  LỊCH SỬ BÀI THI & LUYỆN TẬP
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  /HISTORY
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Theo dõi tiến trình và lọc kết quả theo chế độ thi
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs font-semibold">
            <button
              type="button"
              onClick={onBackToHome}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Trang chủ</span>
            </button>
            <button
              type="button"
              onClick={() => onStartExam('full')}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thi bài mới</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8 w-full">
        {/* Header Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 backdrop-blur-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <History className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Tổng số lượt làm bài</span>
              <p className="text-2xl font-black text-white">{stats.total} lượt</p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 backdrop-blur-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Điểm thi full cao nhất</span>
              <p className="text-2xl font-black text-amber-300">
                {stats.bestScore > 0 ? `${stats.bestScore} / 990` : '—'}
              </p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 backdrop-blur-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Độ chính xác trung bình</span>
              <p className="text-2xl font-black text-emerald-400">{stats.avgAccuracy}%</p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tabs Lọc theo chế độ */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Tất cả ({counts.all})
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter('full')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFilter === 'full'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Thi đầy đủ ({counts.full})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter('skill')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFilter === 'skill'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Kỹ năng ({counts.skill})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter('practice')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFilter === 'practice'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Luyện Part ({counts.practice})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter('review-wrong')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFilter === 'review-wrong'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ôn câu sai ({counts['review-wrong']})</span>
            </button>
          </div>

          {/* Ô tìm kiếm và nút xóa tất cả */}
          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm bài thi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {allAttempts.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-900/50 transition-colors flex items-center space-x-1 flex-shrink-0 cursor-pointer"
                title="Xóa toàn bộ lịch sử thi"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xóa tất cả</span>
              </button>
            )}
          </div>
        </div>

        {/* Danh sách các Attempt Cards */}
        {filteredAttempts.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-500 border border-slate-700 mx-auto flex items-center justify-center">
              <History className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-white">Chưa có kết quả thi nào</h3>
              <p className="text-xs text-slate-400">
                {selectedFilter === 'all'
                  ? 'Bạn chưa hoàn thành bài thi nào. Hãy bắt đầu một bài thi thử để ghi lại lịch sử điểm số!'
                  : `Không tìm thấy kết quả nào thuộc chế độ "${selectedFilter}". Hãy chọn đề và trải nghiệm ngay!`}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onStartExam(selectedFilter === 'all' ? 'full' : selectedFilter)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center space-x-2 transition-all shadow-md shadow-blue-600/30 cursor-pointer"
              >
                <span>Bắt đầu thi ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAttempts.map((att) => {
              const attMode = att.mode || 'full';
              const dateFormatted = new Date(att.createdAt).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={att.id}
                  onClick={() => onReviewAttempt(att)}
                  className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 rounded-2xl p-5 transition-all duration-200 cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-5 hover:shadow-xl hover:shadow-blue-500/5"
                >
                  {/* Left: Mode Badge & Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {attMode === 'full' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center space-x-1">
                          <Award className="w-3 h-3" />
                          <span>Thi thử đầy đủ (120p)</span>
                        </span>
                      )}
                      {attMode === 'skill' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center space-x-1">
                          {att.skill === 'listening' ? (
                            <Headphones className="w-3 h-3" />
                          ) : (
                            <BookOpen className="w-3 h-3" />
                          )}
                          <span>
                            Kỹ năng: {att.skill === 'listening' ? 'Listening' : 'Reading'}
                          </span>
                        </span>
                      )}
                      {attMode === 'practice' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1">
                          <Sliders className="w-3 h-3" />
                          <span>
                            Luyện Part: {att.parts ? att.parts.join(', ') : 'Tự chọn'}
                          </span>
                        </span>
                      )}
                      {attMode === 'review-wrong' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1">
                          <RotateCcw className="w-3 h-3" />
                          <span>Ôn câu sai</span>
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400">
                        {dateFormatted}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                      {att.testTitle}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span>Mã đề: <strong className="text-slate-300 font-mono">{att.testId}</strong></span>
                      <span>•</span>
                      <span>
                        Thời gian:{' '}
                        <strong className="text-slate-300 font-mono">
                          {Math.floor((att.scoreResult.durationSeconds || 0) / 60)}m{' '}
                          {(att.scoreResult.durationSeconds || 0) % 60}s
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Độ chính xác:{' '}
                        <strong className="text-emerald-400 font-bold">
                          {att.scoreResult.overallAccuracy}%
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Middle: Score Summary tailored to mode */}
                  <div className="flex items-center space-x-6 border-t md:border-t-0 md:border-l border-slate-700/60 pt-3 md:pt-0 md:pl-6">
                    {attMode === 'full' && (
                      <div className="text-center md:text-left">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Tổng điểm ETS</div>
                        <div className="text-3xl font-black font-mono text-amber-300">
                          {att.scoreResult.totalScore}
                          <span className="text-xs text-slate-400 font-normal"> / 990</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          L: {att.scoreResult.listeningScaledScore} • R: {att.scoreResult.readingScaledScore}
                        </div>
                      </div>
                    )}

                    {attMode === 'skill' && (
                      <div className="text-center md:text-left">
                        <div className="text-[10px] uppercase font-bold text-teal-400">
                          Điểm kỹ năng {att.skill}
                        </div>
                        <div className="text-3xl font-black font-mono text-teal-300">
                          {att.skill === 'listening'
                            ? att.scoreResult.listeningScaledScore
                            : att.scoreResult.readingScaledScore}
                          <span className="text-xs text-slate-400 font-normal"> / 495</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Đúng {att.scoreResult.totalCorrect}/{att.scoreResult.totalQuestions} câu
                        </div>
                      </div>
                    )}

                    {attMode === 'practice' && (
                      <div className="text-center md:text-left">
                        <div className="text-[10px] uppercase font-bold text-indigo-400">
                          Số câu đúng / sai
                        </div>
                        <div className="text-2xl font-black font-mono text-emerald-400">
                          {att.scoreResult.totalCorrect}
                          <span className="text-xs text-slate-400 font-normal">
                            {' '}/ {att.scoreResult.totalQuestions} câu
                          </span>
                        </div>
                        <div className="text-[11px] text-rose-400 mt-0.5">
                          Sai: {att.scoreResult.totalQuestions - att.scoreResult.totalCorrect} câu ({att.scoreResult.overallAccuracy}%)
                        </div>
                      </div>
                    )}

                    {attMode === 'review-wrong' && (
                      <div className="text-center md:text-left">
                        <div className="text-[10px] uppercase font-bold text-rose-400">
                          Cải thiện câu sai
                        </div>
                        <div className="text-2xl font-black font-mono text-emerald-400">
                          {att.scoreResult.totalCorrect}/{att.scoreResult.totalQuestions}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Chính xác: {att.scoreResult.overallAccuracy}%
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => onReviewAttempt(att)}
                        className="p-2.5 rounded-xl bg-slate-700 hover:bg-blue-600 text-slate-200 hover:text-white transition-all cursor-pointer"
                        title="Xem lại từng câu (Review)"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(att.id, e)}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                        title="Xóa kết quả này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
