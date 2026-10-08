import React from 'react';
import { Clock, Headphones, CheckCircle, Shuffle, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { useExamSessionStore } from '../../../store/useExamSessionStore';

interface OptionsPageProps {
  onBack: () => void;
  onNext: () => void;
}

export const OptionsPage: React.FC<OptionsPageProps> = ({ onBack, onNext }) => {
  const { config, setOptions } = useExamSessionStore();
  const selectedParts = config.parts || [5];
  const isOnlyPart5 = selectedParts.length === 1 && selectedParts[0] === 5;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bước 3: Tùy chỉnh điều kiện luyện tập</span>
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          Tùy chọn cấu hình làm bài (Chế độ Luyện tập)
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Bật/tắt các tính năng hỗ trợ để cá nhân hóa buổi luyện đề TOEIC theo nhu cầu của bạn.
        </p>
      </div>

      <div className="space-y-4">
        {/* 1. ĐỒNG HỒ ĐẾM NGƯỢC (timerEnabled) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  1. Đồng hồ đếm ngược (Timer)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Giới hạn thời gian làm bài theo quy chuẩn. Tắt để luyện tập tự do không áp lực thời gian.
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
              <input
                type="checkbox"
                checked={config.options.timerEnabled}
                onChange={(e) => setOptions({ timerEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>

          {/* Slider chọn thời gian nếu timer bật */}
          {config.options.timerEnabled && (
            <div className="pt-3 border-t border-slate-100 flex items-center space-x-4">
              <span className="text-xs font-semibold text-slate-600">Thời lượng:</span>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={config.options.customMinutes || 20}
                onChange={(e) => setOptions({ customMinutes: parseInt(e.target.value, 10) })}
                className="flex-1 accent-blue-600 cursor-pointer"
              />
              <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                {config.options.customMinutes || 20} phút
              </span>
            </div>
          )}
        </div>

        {/* 2. CHO PHÉP NGHE LẠI AUDIO (allowReplayAudio) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  2. Cho phép nghe lại Audio (Replay Audio)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mở khóa thanh tua và cho phép bấm nghe lại nhiều lần khi làm các câu hỏi phần Listening.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
              <input
                type="checkbox"
                checked={config.options.allowReplayAudio}
                onChange={(e) => setOptions({ allowReplayAudio: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>
        </div>

        {/* 3. XEM ĐÁP ÁN & GIẢI THÍCH NGAY (showAnswerImmediately) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  3. Hiển thị đáp án & giải thích ngay (Instant Explanation)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hiển thị phương án đúng và phân tích chi tiết ngữ pháp/từ vựng ngay sau khi bạn chọn đáp án.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
              <input
                type="checkbox"
                checked={config.options.showAnswerImmediately}
                onChange={(e) => setOptions({ showAnswerImmediately: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>
        </div>

        {/* 4. XÁO TRỘN CÂU HỎI (shuffleQuestions) */}
        <div className={`bg-white border rounded-2xl p-5 shadow-sm transition-opacity ${
          isOnlyPart5 ? 'border-slate-200' : 'border-slate-200 opacity-60'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                <Shuffle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-sm text-slate-900">
                    4. Xáo trộn thứ tự câu hỏi (Shuffle Questions)
                  </h4>
                  {!isOnlyPart5 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      Chỉ cho phép khi luyện riêng Part 5
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đổi ngẫu nhiên thứ tự các câu hỏi để tránh học vẹt vị trí (Chỉ áp dụng khi luyện riêng Part 5 đơn lẻ).
                </p>
              </div>
            </div>

            <label className={`relative inline-flex items-center flex-shrink-0 ml-4 ${
              isOnlyPart5 ? 'cursor-pointer' : 'cursor-not-allowed'
            }`}>
              <input
                type="checkbox"
                disabled={!isOnlyPart5}
                checked={Boolean(config.options.shuffleQuestions && isOnlyPart5)}
                onChange={(e) => setOptions({ shuffleQuestions: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>
        </div>
      </div>

      {/* Điều hướng */}
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
          onClick={onNext}
          className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center space-x-2 shadow-md shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Tiếp tục</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
