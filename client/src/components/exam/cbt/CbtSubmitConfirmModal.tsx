import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';

interface CbtSubmitConfirmModalProps {
  totalQuestions: number;
  answeredCount: number;
  flaggedCount: number;
  unansweredQuestionNumbers?: number[];
  onSelectQuestion?: (qNum: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export const CbtSubmitConfirmModal: React.FC<CbtSubmitConfirmModalProps> = ({
  totalQuestions,
  answeredCount,
  flaggedCount,
  unansweredQuestionNumbers = [],
  onSelectQuestion,
  onCancel,
  onConfirm,
}) => {
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const [hasConfirmedRisk, setHasConfirmedRisk] = useState(false);
  const isSubmitDisabled = unansweredCount > 0 && !hasConfirmedRisk;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-300 rounded-2xl shadow-2xl p-6 md:p-7 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center space-x-3 border-b border-slate-200 pb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            unansweredCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
          }`}>
            {unansweredCount > 0 ? (
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            ) : (
              <CheckCircle className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Xác nhận nộp bài thi</h3>
            <p className="text-xs text-slate-500">Kỳ thi TOEIC CBT — IIG Việt Nam</p>
          </div>
        </div>

        {/* Cảnh báo câu chưa làm */}
        {unansweredCount > 0 ? (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3.5 space-y-2 text-xs text-rose-900">
            <div className="flex items-start space-x-2 font-bold text-rose-800 text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>CẢNH BÁO: Còn {unansweredCount} câu chưa trả lời!</span>
            </div>
            <p className="text-rose-700 leading-relaxed">
              TOEIC <strong>không trừ điểm câu sai</strong>. Bạn nên chọn phương án ngẫu nhiên cho tất cả các câu trước khi nộp bài để có cơ hội đạt điểm cao nhất.
            </p>

            {/* Checkbox cam kết */}
            <label className="flex items-start space-x-2.5 p-2.5 rounded-lg border border-rose-300 bg-white cursor-pointer select-none mt-2">
              <input
                type="checkbox"
                checked={hasConfirmedRisk}
                onChange={(e) => setHasConfirmedRisk(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
              />
              <span className="text-[11px] text-rose-900 font-semibold leading-snug">
                Tôi xác nhận muốn nộp bài sớm dù vẫn còn <strong>{unansweredCount} câu chưa làm</strong>.
              </span>
            </label>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center space-x-2 text-xs text-emerald-900 font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Bạn đã hoàn thành 100% câu hỏi của bài thi!</span>
          </div>
        )}

        {/* Danh sách các câu bỏ trống */}
        {unansweredQuestionNumbers.length > 0 && (
          <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-rose-900 font-bold">
              <span>Danh sách câu bỏ trống ({unansweredQuestionNumbers.length}):</span>
              {onSelectQuestion && (
                <span className="text-[10px] text-slate-500 font-normal italic">
                  * Bấm để làm ngay
                </span>
              )}
            </div>
            <div className="max-h-24 overflow-y-auto flex flex-wrap gap-1.5 p-0.5">
              {unansweredQuestionNumbers.map((qNum) => (
                <button
                  key={qNum}
                  type="button"
                  onClick={() => {
                    if (onSelectQuestion) {
                      onSelectQuestion(qNum);
                      onCancel();
                    }
                  }}
                  className="px-2 py-0.5 rounded bg-white hover:bg-rose-100 text-rose-700 text-xs font-mono font-bold border border-rose-200 hover:border-rose-300 transition-colors cursor-pointer shadow-2xs hover:scale-105"
                  title={`Chuyển đến câu ${qNum}`}
                >
                  Câu {qNum}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bảng kiểm kê */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-600">Tổng số câu hỏi:</span>
            <strong className="font-mono text-slate-900">{totalQuestions} câu</strong>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-600">Số câu đã trả lời:</span>
            <strong className="font-mono text-emerald-700 font-bold">{answeredCount} câu</strong>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-rose-700 font-semibold">Số câu chưa làm:</span>
            <strong className="font-mono text-rose-700 font-bold">{unansweredCount} câu</strong>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-600">Số câu đã gắn cờ (Flag):</span>
            <strong className="font-mono text-amber-700">{flaggedCount} câu</strong>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 italic leading-snug">
          * Khi đã bấm &ldquo;Xác nhận nộp bài&rdquo;, hệ thống sẽ lập tức thu bài và chấm điểm. Bạn không thể quay lại làm bài nữa.
        </p>

        {/* Nút hành động */}
        <div className="flex items-center justify-between pt-2">
          {/* Nút Quay lại làm bài nổi bật vượt trội */}
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-iig-navy hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-md ring-2 ring-blue-300 transition-all flex items-center space-x-1.5 transform hover:scale-[1.02]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại làm tiếp</span>
          </button>

          {/* Nút nộp bài (bị khóa nếu còn câu chưa làm mà chưa check cam kết) */}
          <button
            type="button"
            disabled={isSubmitDisabled}
            onClick={onConfirm}
            className={`px-4 py-2.5 font-bold text-xs rounded-xl transition-all ${
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
  );
};

