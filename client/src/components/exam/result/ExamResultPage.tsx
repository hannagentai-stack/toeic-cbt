import React from 'react';
import {
  Award,
  Headphones,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Search,
  Zap,
  Sliders,
} from 'lucide-react';
import type { ExamScoreResult, PartStat } from '../../../utils/scoreCalculator';
import { attemptService } from '../../../services/attemptService';
import { useExamSessionStore } from '../../../store/useExamSessionStore';

interface ExamResultPageProps {
  scoreResult: ExamScoreResult;
  testTitle: string;
  onReviewExam: () => void;
  onRetakeExam: () => void;
}

export const ExamResultPage: React.FC<ExamResultPageProps> = ({
  scoreResult,
  testTitle,
  onReviewExam,
  onRetakeExam,
}) => {
  const { config } = useExamSessionStore();
  const attemptsHistory = attemptService.getAllAttempts();

  const mode = config?.mode || 'full';
  const skill = config?.skill || 'listening';
  const selectedParts = config?.parts || [];

  // Định dạng thời gian
  const minutes = Math.floor(scoreResult.durationSeconds / 60);
  const seconds = scoreResult.durationSeconds % 60;
  const timeFormatted = `${minutes} phút ${seconds} giây`;

  // Lọc part stats tùy theo mode
  const filteredPartStats = scoreResult.partStats.filter((p: PartStat) => {
    if (mode === 'skill') {
      return skill === 'listening' ? p.part_number <= 4 : p.part_number >= 5;
    }
    if (mode === 'practice') {
      if (selectedParts.length > 0) {
        return selectedParts.includes(p.part_number);
      }
      return p.total_questions > 0;
    }
    return true; // Mode 'full' hoặc 'review-wrong'
  });

  return (
    <div className="max-w-6xl mx-auto my-8 px-4 space-y-8 animate-in fade-in duration-500 font-sans">
      {/* 1. KHUNG CHỨNG CHỈ / BÁO CÁO KẾT QUẢ ĐA NĂNG THEO CHẾ ĐỘ */}

      {/* 1A. CHẾ ĐỘ THI THEO KỸ NĂNG (MODE: SKILL) - CHỈ HIỆN 1 KỸ NĂNG, KHÔNG HIỆN 990 */}
      {mode === 'skill' && (
        <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl shadow-2xl p-8 md:p-10 border border-teal-800/40 relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -top-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
              <div>
                <span className="inline-block px-3 py-1 bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider rounded-md mb-2 border border-teal-500/30">
                  {skill === 'listening' ? 'TOEIC Listening Skill Report' : 'TOEIC Reading Skill Report'}
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {testTitle}
                </h1>
                <p className="text-xs text-slate-300 mt-1">
                  Kỳ thi kỹ năng {skill === 'listening' ? 'Listening (Nghe hiểu)' : 'Reading (Đọc hiểu)'} • Chuẩn hóa CBT
                </p>
              </div>

              <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-xl border border-white/15 backdrop-blur-sm">
                <Award className="w-6 h-6 text-teal-400" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-300 block">Thang điểm kỹ năng</span>
                  <span className="text-sm font-bold text-white">ETS 5 - 495</span>
                </div>
              </div>
            </div>

            {/* Bảng điểm kỹ năng duy nhất */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-6 text-center md:text-left border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-8">
                <span className="text-xs uppercase font-bold text-teal-300 tracking-wider flex items-center justify-center md:justify-start space-x-2">
                  {skill === 'listening' ? <Headphones className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                  <span>Điểm kỹ năng {skill === 'listening' ? 'Listening' : 'Reading'}</span>
                </span>
                <div className="flex items-baseline justify-center md:justify-start space-x-3 my-2">
                  <span className="text-6xl md:text-7xl font-black font-mono tracking-tight text-white drop-shadow-md">
                    {skill === 'listening' ? scoreResult.listeningScaledScore : scoreResult.readingScaledScore}
                  </span>
                  <span className="text-xl md:text-2xl font-bold text-slate-400 font-mono">
                    / 495
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Độ chính xác kỹ năng:{' '}
                  <strong className="text-emerald-400 font-semibold">{scoreResult.overallAccuracy}%</strong> (
                  {skill === 'listening'
                    ? `${scoreResult.listeningRawScore}/${scoreResult.listeningTotalQuestions}`
                    : `${scoreResult.readingRawScore}/${scoreResult.readingTotalQuestions}`}{' '}
                  câu đúng)
                </p>
              </div>

              <div className="md:col-span-6 space-y-4">
                <div className="bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
                      Tiến độ đạt được trên thang ETS 495
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      {Math.round(
                        ((skill === 'listening'
                          ? scoreResult.listeningScaledScore
                          : scoreResult.readingScaledScore) /
                          495) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden mt-3 shadow-inner">
                    <div
                      className="bg-teal-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(45,212,191,0.5)]"
                      style={{
                        width: `${(
                          ((skill === 'listening'
                            ? scoreResult.listeningScaledScore
                            : scoreResult.readingScaledScore) /
                            495) *
                          100
                        ).toFixed(1)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-300 mt-3 leading-relaxed">
                    * Chế độ thi theo kỹ năng chỉ ghi nhận và cấp điểm cho phần{' '}
                    <strong>{skill === 'listening' ? 'Listening' : 'Reading'}</strong>, không bao gồm điểm tổng 990.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1B. CHẾ ĐỘ LUYỆN TẬP THEO PART (MODE: PRACTICE) - KHÔNG QUY ĐỔI ETS, HIỆN ĐÚNG/SAI */}
      {mode === 'practice' && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-2xl p-8 md:p-10 border border-indigo-800/40 relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -top-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
              <div>
                <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider rounded-md mb-2 border border-indigo-500/30">
                  TOEIC Part Practice Report
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {testTitle}
                </h1>
                <p className="text-xs text-slate-300 mt-1">
                  Kết quả luyện tập chuyên sâu các Part đã chọn: {selectedParts.map((p) => `Part ${p}`).join(', ')}
                </p>
              </div>

              <div className="flex items-center space-x-2 bg-indigo-500/20 px-4 py-2 rounded-xl border border-indigo-400/30 backdrop-blur-sm">
                <Sliders className="w-5 h-5 text-indigo-300" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-200 block">Chế độ luyện tập</span>
                  <span className="text-xs font-bold text-white">Không quy đổi điểm ETS</span>
                </div>
              </div>
            </div>

            {/* Thẻ thống kê tổng số câu Đúng / Sai / Tỷ lệ % */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/10 border border-white/15 rounded-2xl p-4.5 text-center backdrop-blur-sm">
                <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block mb-1">
                  Số câu đúng
                </span>
                <span className="text-4xl font-black font-mono text-emerald-400">
                  {scoreResult.totalCorrect}
                </span>
                <span className="text-xs text-slate-300 block mt-1">/ {scoreResult.totalQuestions} câu</span>
              </div>

              <div className="bg-white/10 border border-white/15 rounded-2xl p-4.5 text-center backdrop-blur-sm">
                <span className="text-[11px] uppercase tracking-wider text-rose-300 font-bold block mb-1">
                  Số câu sai
                </span>
                <span className="text-4xl font-black font-mono text-rose-400">
                  {scoreResult.totalQuestions - scoreResult.totalCorrect}
                </span>
                <span className="text-xs text-slate-300 block mt-1">cần xem lại</span>
              </div>

              <div className="bg-white/10 border border-white/15 rounded-2xl p-4.5 text-center backdrop-blur-sm">
                <span className="text-[11px] uppercase tracking-wider text-sky-300 font-bold block mb-1">
                  Độ chính xác
                </span>
                <span className="text-4xl font-black font-mono text-sky-400">
                  {scoreResult.overallAccuracy}%
                </span>
                <span className="text-xs text-slate-300 block mt-1">tỷ lệ hoàn thành</span>
              </div>

              <div className="bg-white/10 border border-white/15 rounded-2xl p-4.5 text-center backdrop-blur-sm">
                <span className="text-[11px] uppercase tracking-wider text-amber-300 font-bold block mb-1">
                  Thời gian làm bài
                </span>
                <span className="text-2xl font-black font-mono text-amber-300 block mt-2">
                  {minutes}m {seconds}s
                </span>
                <span className="text-xs text-slate-300 block mt-1">
                  ~{scoreResult.avgSecondsPerQuestion}s / câu
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1C. CHẾ ĐỘ THI THỬ ĐẦY ĐỦ (MODE: FULL HOẶC REVIEW-WRONG) - CHỨNG CHỈ ĐIỂM SỐ 990 CHUẨN */}
      {(mode === 'full' || mode === 'review-wrong') && (
        <div className="bg-gradient-to-br from-iig-navy via-iig-dark to-[#081B33] text-white rounded-3xl shadow-2xl p-8 md:p-10 border border-slate-700 relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -top-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
              <div>
                <span className="inline-block px-3 py-1 bg-white/15 text-sky-300 text-xs font-bold uppercase tracking-wider rounded-md mb-2">
                  {mode === 'review-wrong' ? 'Mistake Review Report' : 'TOEIC Listening & Reading Official Simulation'}
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {testTitle}
                </h1>
                <p className="text-xs text-slate-300 mt-1">
                  Kỳ thi thử mô phỏng theo chuẩn máy tính IIG Việt Nam
                </p>
              </div>

              <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-xl border border-white/15 backdrop-blur-sm">
                <Award className="w-6 h-6 text-amber-400" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-300 block">Quy đổi chuẩn</span>
                  <span className="text-sm font-bold text-white">ETS 10 - 990</span>
                </div>
              </div>
            </div>

            {/* Bảng điểm lớn */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Cột Tổng điểm nổi bật */}
              <div className="lg:col-span-5 text-center lg:text-left border-b lg:border-b-0 lg:border-r border-white/10 pb-6 lg:pb-0 lg:pr-8">
                <span className="text-xs uppercase font-bold text-sky-300 tracking-wider">
                  Tổng điểm đạt được
                </span>
                <div className="flex items-baseline justify-center lg:justify-start space-x-3 my-2">
                  <span className="text-6xl md:text-7xl font-black font-mono tracking-tight text-white drop-shadow-md">
                    {scoreResult.totalScore}
                  </span>
                  <span className="text-xl md:text-2xl font-bold text-slate-400 font-mono">
                    / 990
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Độ chính xác toàn bài:{' '}
                  <strong className="text-emerald-400 font-semibold">{scoreResult.overallAccuracy}%</strong> (
                  {scoreResult.totalCorrect}/{scoreResult.totalQuestions} câu)
                </p>
              </div>

              {/* Cột Điểm chi tiết Listening & Reading */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Thẻ Listening */}
                <div className="bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Headphones className="w-5 h-5 text-sky-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
                        Listening
                      </span>
                    </div>
                    <span className="text-xs text-slate-300 font-mono">
                      {scoreResult.listeningRawScore}/{scoreResult.listeningTotalQuestions} đúng
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-extrabold font-mono text-white">
                      {scoreResult.listeningScaledScore}
                    </span>
                    <span className="text-sm text-slate-300">/ 495</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-sky-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(scoreResult.listeningScaledScore / 495) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Thẻ Reading */}
                <div className="bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-5 h-5 text-indigo-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                        Reading
                      </span>
                    </div>
                    <span className="text-xs text-slate-300 font-mono">
                      {scoreResult.readingRawScore}/{scoreResult.readingTotalQuestions} đúng
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-extrabold font-mono text-white">
                      {scoreResult.readingScaledScore}
                    </span>
                    <span className="text-sm text-slate-300">/ 495</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-indigo-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(scoreResult.readingScaledScore / 495) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ghi chú khuyến cáo thang điểm ước lượng */}
            <div className="mt-8 pt-4 border-t border-white/10 flex items-start space-x-2 text-[11px] text-slate-300 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Lưu ý:</strong> Điểm số trên được quy đổi dựa trên bảng phân phối độ khó xấp xỉ của đề thi TOEIC chuẩn ETS. Đây là điểm số ước lượng phục vụ mục đích tự đánh giá và luyện thi, không thay thế cho phiếu điểm (Score Report) chính thức do IIG/ETS cấp.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. CHỈ SỐ TỐC ĐỘ LÀM BÀI & THỜI GIAN (HIỂN THỊ CHUNG) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Tổng thời gian thi</span>
            <p className="text-lg font-bold text-slate-800">{timeFormatted}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Tốc độ trung bình</span>
            <p className="text-lg font-bold text-slate-800 font-mono">
              {scoreResult.avgSecondsPerQuestion}s{' '}
              <span className="text-xs text-slate-500 font-normal">/ câu</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Số câu làm đúng</span>
            <p className="text-lg font-bold text-slate-800 font-mono">
              {scoreResult.totalCorrect}{' '}
              <span className="text-xs text-slate-500 font-normal">/ {scoreResult.totalQuestions} câu</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. BIỂU ĐỒ & BẢNG THỐNG KÊ CHI TIẾT THEO PART (ĐÚNG/SAI RÕ RÀNG Ở MODE PRACTICE) */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {mode === 'practice'
                ? 'Bảng chi tiết số câu đúng / sai theo từng Part'
                : 'Biểu đồ độ chính xác theo từng Part'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'practice'
                ? 'Thống kê chi tiết câu đúng, câu sai và câu chưa làm cho các Part bạn đã rèn luyện'
                : 'Tỷ lệ làm đúng các Part đã hoàn thành để nhận diện thế mạnh và lỗ hổng kiến thức'}
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
            {filteredPartStats.length} Parts
          </span>
        </div>

        {/* Danh sách các Part */}
        <div className="space-y-4">
          {filteredPartStats.map((p: PartStat) => {
            let barColor = 'bg-rose-500';
            let badgeColor = 'text-rose-700 bg-rose-50 border-rose-200';
            if (p.accuracy >= 75) {
              barColor = 'bg-emerald-500';
              badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
            } else if (p.accuracy >= 50) {
              barColor = 'bg-blue-500';
              badgeColor = 'text-blue-700 bg-blue-50 border-blue-200';
            }

            return (
              <div key={p.part_number} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-mono font-bold text-xs">
                      P{p.part_number}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{p.part_name}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                      ✓ Đúng: <strong>{p.correct_count}</strong>
                    </span>
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-medium">
                      ✗ Sai: <strong>{p.incorrect_count}</strong>
                    </span>
                    {p.unanswered_count > 0 && (
                      <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
                        Bỏ trống: <strong>{p.unanswered_count}</strong>
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded border font-mono font-bold ${badgeColor}`}>
                      {p.accuracy}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`${barColor} h-full rounded-full transition-all duration-1000`}
                    style={{ width: `${p.accuracy}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. PHÂN TÍCH ĐIỂM YẾU & GỢI Ý ÔN LUYỆN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Điểm yếu */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2.5 text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-base">Phân tích điểm cần khắc phục</h3>
          </div>
          <ul className="space-y-2.5 text-xs md:text-sm text-slate-700">
            {scoreResult.weaknesses.map((w: string, idx: number) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                <span className="leading-relaxed">{w}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Lời khuyên ôn luyện */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2.5 text-amber-900">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-base">Đề xuất lộ trình luyện tập</h3>
          </div>
          <ul className="space-y-2.5 text-xs md:text-sm text-slate-700">
            {scoreResult.recommendations.map((r: string, idx: number) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <span className="leading-relaxed">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 5. LỊCH SỬ TIẾN BỘ GẦN NHẤT */}
      {attemptsHistory.length > 1 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-iig-accent" />
              <h3 className="font-bold text-base text-slate-800">
                Lịch sử các lần làm bài gần nhất ({attemptsHistory.length} lượt)
              </h3>
            </div>
            <span className="text-xs text-slate-500">Lưu tự động trong hệ thống</span>
          </div>

          <div className="space-y-2.5">
            {attemptsHistory.slice(0, 5).map((att, idx) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-slate-500 font-mono">#{idx + 1}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800 text-sm">
                        {att.mode === 'practice'
                          ? `Đúng ${att.scoreResult.totalCorrect}/${att.scoreResult.totalQuestions} câu (${att.scoreResult.overallAccuracy}%)`
                          : att.mode === 'skill'
                          ? `${att.skill === 'listening' ? att.scoreResult.listeningScaledScore : att.scoreResult.readingScaledScore} điểm (Kỹ năng ${att.skill})`
                          : `${att.scoreResult.totalScore} điểm (Tổng 990)`}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          att.mode === 'skill'
                            ? 'bg-teal-100 text-teal-800'
                            : att.mode === 'practice'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {att.mode || 'full'}
                      </span>
                    </div>
                    <span className="text-slate-500">
                      {att.testTitle}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-600 block">
                    {new Date(att.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Đúng {att.scoreResult.totalCorrect}/{att.scoreResult.totalQuestions} câu
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. HÀNH ĐỘNG ĐIỀU HƯỚNG */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 pb-12">
        <button
          type="button"
          onClick={onReviewExam}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3.5 bg-iig-accent hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 text-base cursor-pointer"
        >
          <Search className="w-5 h-5" />
          <span>Xem lại chi tiết từng câu (Review)</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onRetakeExam}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Làm lại đề này</span>
        </button>
      </div>
    </div>
  );
};
