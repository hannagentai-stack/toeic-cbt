import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, HelpCircle, ArrowLeft } from 'lucide-react';
import { useReadingStore } from '../../../store/useReadingStore';

interface SubmitModalProps {
  totalQuestions: number;
  questionNumbers?: number[];
  onConfirmSubmit: () => void;
}

export const SubmitModal: React.FC<SubmitModalProps> = ({
  totalQuestions,
  questionNumbers = [],
  onConfirmSubmit,
}) => {
  const {
    answers,
    flaggedQuestions,
    timeRemainingSeconds,
    closeSubmitModal,
    jumpToQuestion,
  } = useReadingStore();

  const [hasConfirmedRisk, setHasConfirmedRisk] = useState(false);
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const flaggedCount = flaggedQuestions.length;
  const isSubmitDisabled = unansweredCount > 0 && !hasConfirmedRisk;

  const unansweredNumbers = questionNumbers.filter((num) => answers[num] === undefined);

  const minutes = Math.floor(timeRemainingSeconds / 60);
  const seconds = timeRemainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95">
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="text-base md:text-lg font-bold">Xác nhận nộp bài thi TOEIC</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hệ thống sẽ thu bài và chấm điểm ngay lập tức
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-sky-400" />
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Cảnh báo nếu còn câu chưa làm */}
          {unansweredCount > 0 ? (
            <div className="bg-rose-50 border-2 border-rose-300 p-4 rounded-xl space-y-2.5 text-rose-900">
              <div className="flex items-start space-x-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <p className="text-sm font-bold text-rose-800">
                    CẢNH BÁO: Bạn còn <span className="text-rose-700 text-base underline">{unansweredCount}</span> câu chưa làm!
                  </p>
                  <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                    TOEIC <strong>không trừ điểm câu sai</strong>. Bạn nên chọn đáp án ngẫu nhiên cho tất cả các câu chưa làm trước khi nộp để tối ưu điểm số.
                  </p>
                </div>
              </div>

              {/* Checkbox cam kết */}
              <label className="flex items-start space-x-2.5 p-2.5 rounded-lg border border-rose-300 bg-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasConfirmedRisk}
                  onChange={(e) => setHasConfirmedRisk(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                />
                <span className="text-xs text-rose-900 font-semibold leading-snug">
                  Tôi xác nhận muốn nộp bài sớm dù vẫn còn <strong>{unansweredCount} câu chưa làm</strong>.
                </span>
              </label>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center space-x-3 text-emerald-900">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-bold">
                Tuyệt vời! Bạn đã hoàn thành toàn bộ 100% câu hỏi Reading.
              </p>
            </div>
          )}

          {/* Danh sách các câu bỏ trống */}
          {unansweredNumbers.length > 0 && (
            <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs text-rose-900 font-bold">
                <span>Danh sách câu bỏ trống ({unansweredNumbers.length}):</span>
                <span className="text-[11px] text-slate-500 font-normal italic">
                  * Bấm vào số câu để làm ngay
                </span>
              </div>
              <div className="max-h-28 overflow-y-auto flex flex-wrap gap-1.5 p-0.5">
                {unansweredNumbers.map((qNum) => (
                  <button
                    key={qNum}
                    type="button"
                    onClick={() => {
                      jumpToQuestion(qNum);
                      closeSubmitModal();
                    }}
                    className="px-2.5 py-1 rounded-md bg-white hover:bg-rose-100 text-rose-700 text-xs font-mono font-bold border border-rose-200 hover:border-rose-300 transition-all cursor-pointer shadow-2xs hover:scale-105"
                    title={`Chuyển đến câu ${qNum}`}
                  >
                    Câu {qNum}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bảng tóm tắt thống kê */}
          <div className="grid grid-cols-2 gap-2.5 text-center">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs text-slate-500 font-medium">Đã trả lời</span>
              <p className="text-lg font-black text-emerald-600 font-mono">
                {answeredCount}/{totalQuestions}
              </p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs text-slate-500 font-medium">Chưa làm</span>
              <p className="text-lg font-black text-rose-600 font-mono">
                {unansweredCount}
              </p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs text-slate-500 font-medium">Đã cờ (Flag)</span>
              <p className="text-lg font-black text-amber-600 font-mono">
                {flaggedCount}
              </p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs text-slate-500 font-medium">Thời gian còn</span>
              <p className="text-lg font-black text-slate-700 font-mono">
                {timeFormatted}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic leading-snug">
            * Sau khi nộp bài, hệ thống sẽ chuyển sang màn hình Bảng điểm & Phân tích năng lực chi tiết.
          </p>

          {/* Nút hành động */}
          <div className="pt-2 flex items-center justify-between">
            {/* Nút Tiếp tục làm bài nổi bật */}
            <button
              type="button"
              onClick={closeSubmitModal}
              className="px-6 py-2.5 bg-iig-navy hover:bg-blue-900 text-white font-bold rounded-xl text-xs md:text-sm shadow-md ring-2 ring-blue-300 transition-all flex items-center space-x-1.5 transform hover:scale-[1.02]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Tiếp tục làm bài</span>
            </button>

            {/* Nút Nộp bài bị khóa nếu chưa check cam kết */}
            <button
              type="button"
              disabled={isSubmitDisabled}
              onClick={onConfirmSubmit}
              className={`px-5 py-2.5 font-bold rounded-xl text-xs md:text-sm transition-all ${
                isSubmitDisabled
                  ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-95'
              }`}
            >
              Xác nhận nộp bài
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

