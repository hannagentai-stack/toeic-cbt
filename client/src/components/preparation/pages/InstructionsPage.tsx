import React from 'react';
import {
  Keyboard,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Clock,
  Headphones,
  FileCheck,
} from 'lucide-react';
import { useExamSessionStore } from '../../../store/useExamSessionStore';

interface InstructionsPageProps {
  onBack: () => void;
  onStartExam: () => void;
}

export const InstructionsPage: React.FC<InstructionsPageProps> = ({ onBack, onStartExam }) => {
  const { config, setTermsAccepted, getRules } = useExamSessionStore();
  const rules = getRules();

  const getModeTitle = () => {
    switch (config.mode) {
      case 'full':
        return 'Thi thử đầy đủ (Listening + Reading • 120 phút)';
      case 'skill':
        return `Thi theo kỹ năng: ${config.skill === 'listening' ? 'Listening (45 phút)' : 'Reading (75 phút)'}`;
      case 'practice':
        return `Luyện theo Part: ${(config.parts || [5]).map((p) => `Part ${p}`).join(', ')}`;
      case 'review-wrong':
        return 'Ôn tập câu làm sai từ lịch sử';
      default:
        return 'TOEIC CBT';
    }
  };

  const candidate = config.candidate || {
    fullName: 'NGUYỄN VĂN AN',
    candidateId: 'VN-882901-CBT',
    targetScore: 750,
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bước cuối: Quy chế phòng thi & Xác nhận</span>
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          Quy chế & Hướng dẫn làm bài thi CBT
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Đọc kỹ quy tắc thực tế áp dụng cho phiên thi của bạn trước khi bấm nút Bắt đầu tính giờ.
        </p>
      </div>

      {/* 1. BẢNG TỔNG HỢP QUY TẮC THỰC TẾ (LẤY TỪ getExamRules) */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Quy tắc thực tế phiên thi (ETS Official Enforcement)</span>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
            rules.isRealExam
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
          }`}>
            {rules.isRealExam ? 'Chế độ thi thật (Khóa bảo mật)' : 'Chế độ luyện tập (Linh hoạt)'}
          </span>
        </div>

        {/* Lưới thông số áp dụng thực tế */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Chế độ làm bài:</span>
            <span className="font-bold text-slate-100 text-sm mt-0.5 block">{getModeTitle()}</span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Thời gian làm bài:</span>
            <span className="font-bold text-amber-300 text-sm mt-0.5 block flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{rules.timerEnabled ? `${rules.durationMinutes} phút đếm ngược` : 'Không giới hạn thời gian'}</span>
            </span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Kiểm soát âm thanh (Audio):</span>
            <span className="font-bold text-slate-100 text-sm mt-0.5 block flex items-center space-x-1.5">
              <Headphones className="w-3.5 h-3.5 text-sky-400" />
              <span>{rules.allowReplayAudio ? 'Cho phép nghe lại nhiều lần' : 'Khóa tua • Phát 1 lần chuẩn ETS'}</span>
            </span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Quy tắc quay lại câu hỏi:</span>
            <span className="font-bold text-slate-100 text-sm mt-0.5 block">
              {rules.allowGoBackInListening ? 'Được quay lại câu trước' : 'Listening: Khóa quay lại câu nghe'}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Hiển thị đáp án & Giải thích:</span>
            <span className="font-bold text-slate-100 text-sm mt-0.5 block">
              {rules.showAnswerImmediately ? 'Hiện giải thích sau mỗi câu' : 'Bảo mật đến khi nộp bài'}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Thí sinh:</span>
            <span className="font-bold text-emerald-300 text-sm mt-0.5 block truncate">
              {candidate.fullName} ({candidate.candidateId})
            </span>
          </div>
        </div>
      </div>

      {/* 2. BẢNG PHÍM TẮT & LƯU Ý PHÒNG THI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bảng phím tắt */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Keyboard className="w-4 h-4 text-blue-600" />
            <span>Phím tắt thao tác nhanh trong phòng thi</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-700 font-medium">Chọn phương án trả lời</span>
              <div className="flex space-x-1">
                {['A', 'B', 'C', 'D'].map((k) => (
                  <kbd key={k} className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800 shadow-xs">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-700 font-medium">Chuyển sang câu tiếp theo</span>
              <div className="flex space-x-1">
                <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800 shadow-xs">N</kbd>
                <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800 shadow-xs">→</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-700 font-medium">Quay lại câu trước đó</span>
              <div className="flex space-x-1">
                <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800 shadow-xs">P</kbd>
                <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800 shadow-xs">←</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-700 font-medium">Đánh dấu cờ xem lại (Flag)</span>
              <kbd className="px-2.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-amber-700 shadow-xs">F</kbd>
            </div>
          </div>
        </div>

        {/* Quy định phòng thi */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>Quy chế quan trọng trong phòng thi</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-600 list-disc pl-4 leading-relaxed">
            <li>
              <strong>Tự động sao lưu:</strong> Mỗi đáp án bạn chọn sẽ được lưu ngay vào bộ nhớ trình duyệt để phòng ngừa rủi ro mất điện hoặc mất mạng.
            </li>
            <li>
              <strong>Bảng câu hỏi (Palette):</strong> Nằm ở thanh bên phải giúp bạn kiểm tra câu chưa làm và câu đã gắn cờ xem lại.
            </li>
            <li>
              <strong>Hết giờ làm bài:</strong> Hệ thống sẽ tự động thu bài và chuyển sang màn hình phân tích điểm số chuẩn ETS.
            </li>
          </ul>
        </div>
      </div>

      {/* 3. CHECKBOX "TÔI ĐÃ ĐỌC VÀ HIỂU" */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(config.isTermsAccepted)}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
          />
          <div>
            <div className="font-black text-blue-950 text-sm">
              Tôi đã đọc và hiểu toàn bộ quy chế phòng thi TOEIC CBT
            </div>
            <p className="text-xs text-blue-800/80 mt-0.5">
              Cam kết tuân thủ thời gian và làm bài nghiêm túc để kết quả đánh giá phản ánh chính xác nhất năng lực tiếng Anh của bạn.
            </p>
          </div>
        </label>
      </div>

      {/* 4. ĐIỀU HƯỚNG & NÚT "BẮT ĐẦU THI" */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        <button
          type="button"
          onClick={onStartExam}
          disabled={!config.isTermsAccepted}
          className={`px-8 py-3.5 rounded-xl font-black text-sm sm:text-base flex items-center space-x-2.5 shadow-lg transition-all ${
            config.isTermsAccepted
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <span>BẮT ĐẦU THI</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
