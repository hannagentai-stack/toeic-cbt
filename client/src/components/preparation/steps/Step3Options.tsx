import React from 'react';
import {
  Headphones,
  BookOpen,
  Check,
  Clock,
  AlertCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useExamSessionStore } from '../../../store/useExamSessionStore';
import { attemptService } from '../../../services/attemptService';

const PART_METADATA = [
  { part: 1, name: 'Part 1: Photographs', skill: 'L', desc: 'Tranh ảnh miêu tả hoạt động & đồ vật' },
  { part: 2, name: 'Part 2: Question-Response', skill: 'L', desc: 'Hỏi - đáp nhanh (3 lựa chọn A, B, C)' },
  { part: 3, name: 'Part 3: Conversations', skill: 'L', desc: 'Đoạn hội thoại 2-3 người kèm bảng biểu' },
  { part: 4, name: 'Part 4: Short Talks', skill: 'L', desc: 'Bài nói ngắn, thông báo, tin nhắn thoại' },
  { part: 5, name: 'Part 5: Incomplete Sentences', skill: 'R', desc: 'Ngữ pháp & từ vựng đơn câu' },
  { part: 6, name: 'Part 6: Text Completion', skill: 'R', desc: 'Điền từ & câu vào đoạn văn' },
  { part: 7, name: 'Part 7: Reading Comprehension', skill: 'R', desc: 'Đoạn đơn, đoạn kép, đoạn ba' },
];

export const Step3Options: React.FC = () => {
  const {
    config,
    setSkill,
    setOptions,
    togglePart,
    setMistakeAttemptId,
    getRules,
  } = useExamSessionStore();

  const rules = getRules();
  const attempts = attemptService.getAllAttempts();
  const selectedParts = config.parts || [5];
  const isOnlyPart5 = selectedParts.length === 1 && selectedParts[0] === 5;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          Bước 3: Tùy chọn cấu hình bài thi
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Thiết lập chi tiết điều kiện làm bài theo chế độ bạn đã chọn.
        </p>
      </div>

      {/* 1. CHẾ ĐỘ THI THỬ ĐẦY ĐỦ (FULL) */}
      {config.mode === 'full' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-950 text-base">
                Cấu hình thi thử đầy đủ chuẩn IIG CBT (Quy tắc thi thật)
              </h3>
              <p className="text-xs text-emerald-700">
                Toàn bộ quy chế và thời gian được thiết lập tự động, không thể sửa đổi
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-emerald-900 bg-white/80 p-4 rounded-xl border border-emerald-100">
            <div>• <strong>Listening:</strong> 100 câu, 45 phút, audio phát 1 lần không dừng, khóa quay lại.</div>
            <div>• <strong>Reading:</strong> 100 câu, 75 phút, tự do chuyển câu và xem lại.</div>
            <div>• <strong>Đồng hồ:</strong> {rules.durationMinutes} phút đếm ngược chuẩn ETS (Bắt buộc bật).</div>
            <div>• <strong>Đáp án & Giải thích:</strong> Khóa bảo mật trong suốt bài thi.</div>
          </div>
        </div>
      )}

      {/* 2. CHẾ ĐỘ THI THEO KỸ NĂNG (SKILL) */}
      {config.mode === 'skill' && (
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Chọn 1 kỹ năng bạn muốn thi (Quy tắc thi thật nghiêm ngặt):
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSkill('listening')}
              className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                config.skill === 'listening'
                  ? 'border-sky-600 bg-sky-50 ring-2 ring-sky-200 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Kỹ năng Listening</h4>
                  <span className="text-xs text-slate-500 font-mono">Part 1, 2, 3, 4</span>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Thời gian 45 phút, thang điểm 5 - 495. Audio phát tuần tự chuẩn thi máy, không tua lại.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSkill('reading')}
              className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                config.skill === 'reading'
                  ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Kỹ năng Reading</h4>
                  <span className="text-xs text-slate-500 font-mono">Part 5, 6, 7</span>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Thời gian 75 phút, thang điểm 5 - 495. Tự do điều hướng giữa 100 câu đọc.
              </p>
            </button>
          </div>

          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-900 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <span>
              Quy tắc thi thật: Đồng hồ luôn bật ({rules.durationMinutes} phút), không xem trước đáp án, không phát lại audio.
            </span>
          </div>
        </div>
      )}

      {/* 3. CHẾ ĐỘ LUYỆN THEO PART (PRACTICE) */}
      {config.mode === 'practice' && (
        <div className="space-y-6">
          {/* Chọn các Part */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chọn các Part cần luyện (chọn 1 hoặc nhiều):
              </label>
              <span className="text-xs text-blue-600 font-semibold font-mono">
                Đã chọn: {selectedParts.length}/7 Part
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {PART_METADATA.map((p) => {
                const isChecked = selectedParts.includes(p.part);

                return (
                  <button
                    key={p.part}
                    type="button"
                    onClick={() => togglePart(p.part)}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex items-start space-x-3 cursor-pointer ${
                      isChecked
                        ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-1 ring-blue-300'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                        isChecked ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-slate-100'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-900">{p.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                          {p.skill === 'L' ? 'Nghe' : 'Đọc'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{p.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chọn giới hạn thời gian (timerEnabled & customMinutes) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Đồng hồ đếm ngược (Timer):</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={config.options.timerEnabled}
                  onChange={(e) => setOptions({ timerEnabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer"
                />
                <span>{config.options.timerEnabled ? 'Bật tính giờ' : 'Tắt (Làm bài tự do)'}</span>
              </label>
            </div>

            {config.options.timerEnabled ? (
              <div className="pt-2 flex items-center space-x-4">
                <input
                  type="range"
                  min="5"
                  max="90"
                  step="5"
                  value={config.options.customMinutes || rules.durationMinutes || 20}
                  onChange={(e) => setOptions({ customMinutes: parseInt(e.target.value, 10) })}
                  className="flex-1 accent-blue-600 cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                  {config.options.customMinutes || rules.durationMinutes || 20} phút
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Bạn có thể làm bài không áp lực thời gian và tự do bấm nộp bài bất cứ lúc nào.
              </p>
            )}
          </div>

          {/* Tùy chọn hỗ trợ luyện tập */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.options.showAnswerImmediately}
                onChange={(e) => setOptions({ showAnswerImmediately: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Xem đáp án ngay</span>
                <span className="text-[11px] text-slate-500">Hiện lời giải sau mỗi câu</span>
              </div>
            </label>

            <label className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.options.allowReplayAudio}
                onChange={(e) => setOptions({ allowReplayAudio: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Cho phép nghe lại audio</span>
                <span className="text-[11px] text-slate-500">Mở khóa thanh tua & nghe lại</span>
              </div>
            </label>

            <label className={`p-3.5 rounded-xl border bg-white flex items-center space-x-3 select-none ${
              isOnlyPart5 ? 'cursor-pointer border-slate-200' : 'opacity-60 cursor-not-allowed border-slate-200'
            }`}>
              <input
                type="checkbox"
                disabled={!isOnlyPart5}
                checked={Boolean(config.options.shuffleQuestions && isOnlyPart5)}
                onChange={(e) => setOptions({ shuffleQuestions: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Xáo trộn câu hỏi</span>
                <span className="text-[11px] text-slate-500">
                  {isOnlyPart5 ? 'Đổi thứ tự ngẫu nhiên Part 5' : 'Chỉ áp dụng khi luyện riêng Part 5'}
                </span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* 4. CHẾ ĐỘ ÔN LẠI CÂU SAI (REVIEW-WRONG) */}
      {config.mode === 'review-wrong' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Chọn lần thi nguồn để lọc câu sai:
            </label>
            <span className="text-xs text-amber-600 font-semibold flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Tự động bật xem giải thích ngay & nghe lại audio</span>
            </span>
          </div>

          {attempts.length === 0 ? (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center space-x-3 text-xs text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <strong className="block font-bold">Chưa có lịch sử làm bài trước đây!</strong>
                <span>
                  Bạn chưa thực hiện lần thi nào trên máy này. Hệ thống sẽ sử dụng bộ câu hỏi mẫu để bạn làm quen.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {attempts.map((att) => {
                const isSelected =
                  config.mistakeSourceAttemptId === att.id ||
                  (!config.mistakeSourceAttemptId && att === attempts[0]);
                const wrongCount = att.scoreResult
                  ? att.scoreResult.totalQuestions - att.scoreResult.totalCorrect
                  : 0;

                return (
                  <div
                    key={att.id}
                    onClick={() => setMistakeAttemptId(att.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-200'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{att.testTitle}</h4>
                      <p className="text-xs text-slate-500">
                        {new Date(att.createdAt).toLocaleString('vi-VN')} • Điểm số: {att.scoreResult?.totalScore || 0}/990
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 text-xs font-bold font-mono">
                        {wrongCount} câu sai
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tùy chọn ôn câu sai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.options.showAnswerImmediately}
                onChange={(e) => setOptions({ showAnswerImmediately: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded border-slate-300"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Xem đáp án & giải thích ngay</span>
                <span className="text-[11px] text-slate-500">Phân tích lỗi sai sau khi trả lời</span>
              </div>
            </label>

            <label className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.options.allowReplayAudio}
                onChange={(e) => setOptions({ allowReplayAudio: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded border-slate-300"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Cho phép nghe lại audio</span>
                <span className="text-[11px] text-slate-500">Nghe lại nhiều lần để hiểu rõ ngữ cảnh</span>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
