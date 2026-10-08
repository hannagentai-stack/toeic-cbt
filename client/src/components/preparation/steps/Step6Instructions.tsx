import React from 'react';
import {
  Keyboard,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useExamSessionStore } from '../../../store/useExamSessionStore';

interface Step6InstructionsProps {
  onStartExam: () => void;
}

export const Step6Instructions: React.FC<Step6InstructionsProps> = ({ onStartExam }) => {
  const { config, setTermsAccepted, getRules } = useExamSessionStore();
  const rules = getRules();

  const getModeTitle = () => {
    switch (config.mode) {
      case 'full':
        return 'Thi thử đầy đủ (Listening + Reading)';
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

  const getTimeInfo = () => {
    if (!rules.timerEnabled) return 'Không giới hạn thời gian (Tự do)';
    return `${rules.durationMinutes} phút`;
  };

  const candidate = config.candidate || {
    fullName: 'NGUYỄN VĂN AN',
    candidateId: 'VN-882901-CBT',
    targetScore: 750,
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          Bước 6: Quy chế phòng thi & Sẵn sàng làm bài
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Kiểm tra lại lần cuối thông số bài thi, xem qua bảng phím tắt và ấn Bắt đầu để đồng hồ bấm giờ hoạt động.
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
          <Sparkles className="w-4 h-4" />
          <span>Tổng hợp thông tin phiên thi</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
          <div>
            <div className="text-xs text-slate-400">Chế độ làm bài:</div>
            <div className="font-bold text-slate-100 text-sm mt-0.5">{getModeTitle()}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Đề thi:</div>
            <div className="font-bold text-slate-100 text-sm mt-0.5 truncate" title={config.testTitle}>
              {config.testId}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Thời gian quy định:</div>
            <div className="font-bold text-amber-300 text-sm mt-0.5">{getTimeInfo()}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Thí sinh:</div>
            <div className="font-bold text-slate-100 text-sm mt-0.5">
              {candidate.fullName} ({candidate.candidateId})
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Mục tiêu kỳ thi:</div>
            <div className="font-bold text-emerald-400 text-sm mt-0.5">
              {candidate.targetScore || 750} / 990 điểm
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Quy tắc thi thực tế:</div>
            <div className="font-bold text-sm mt-0.5 flex items-center space-x-1 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>{rules.isRealExam ? 'Khóa bảo mật thi thật 100%' : 'Chế độ luyện tập mở'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Phím tắt & Hướng dẫn làm bài */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bảng phím tắt */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
            <Keyboard className="w-5 h-5 text-blue-600" />
            <span>Phím tắt hỗ trợ thao tác nhanh</span>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-700 font-medium">Chọn đáp án A, B, C, D</span>
              <div className="flex space-x-1">
                {['A', 'B', 'C', 'D'].map((k) => (
                  <kbd key={k} className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800 shadow-xs">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-700 font-medium">Chuyển sang câu tiếp theo</span>
              <div className="flex space-x-1">
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800 shadow-xs">N</kbd>
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800 shadow-xs">→</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-700 font-medium">Quay lại câu trước đó</span>
              <div className="flex space-x-1">
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800 shadow-xs">P</kbd>
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800 shadow-xs">←</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-700 font-medium">Đánh dấu cờ xem lại (Flag)</span>
              <kbd className="px-2.5 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-amber-700 shadow-xs">F</kbd>
            </div>
          </div>
        </div>

        {/* Quy định & lưu ý quan trọng */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Quy định & Lưu ý trong phòng thi</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-600 list-disc pl-4">
            <li>
              <strong>Đồng hồ đếm ngược:</strong> {rules.timerEnabled ? `Tính giờ ${rules.durationMinutes} phút ngay khi vào phòng thi.` : 'Chế độ luyện tập tự do không giới hạn thời gian.'}
            </li>
            <li>
              <strong>Tự động lưu:</strong> Mọi lựa chọn đáp án và cờ đánh dấu đều được tự động lưu ngay lập tức vào phiên thi sessionStorage.
            </li>
            <li>
              <strong>Âm thanh:</strong> {rules.allowReplayAudio ? 'Cho phép bấm nghe lại audio khi luyện tập.' : 'Khóa tua và chỉ phát một lần duy nhất chuẩn thi thật.'}
            </li>
            <li>
              <strong>Giải thích:</strong> {rules.showAnswerImmediately ? 'Đáp án và giải thích chi tiết hiển thị ngay sau mỗi câu.' : 'Đáp án được bảo mật cho đến khi hoàn thành nộp bài.'}
            </li>
          </ul>
        </div>
      </div>

      {/* Cam kết & Checkbox bắt buộc */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-3">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.isTermsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
          />
          <div>
            <div className="font-bold text-blue-950 text-sm">
              Tôi xác nhận đã hiểu rõ quy chế phòng thi và sẵn sàng làm bài nghiêm túc
            </div>
            <p className="text-xs text-blue-800/80 mt-0.5">
              Đảm bảo không gian yên tĩnh, tắt các ứng dụng gây xao nhãng để đạt kết quả thi thử phản ánh chính xác nhất năng lực của bạn.
            </p>
          </div>
        </label>
      </div>

      {/* Nút hành động chính: Bắt đầu vào thi */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onStartExam}
          disabled={!config.isTermsAccepted}
          className={`px-8 py-4 rounded-2xl font-black text-base flex items-center space-x-3 shadow-lg transition-all ${
            config.isTermsAccepted
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <span>VÀO PHÒNG THI & BẮT ĐẦU TÍNH GIỜ</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
