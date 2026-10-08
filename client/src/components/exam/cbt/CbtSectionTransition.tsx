import React from 'react';
import { CheckCircle2, BookOpen, ArrowRight } from 'lucide-react';

interface CbtSectionTransitionProps {
  onStartReading: () => void;
}

export const CbtSectionTransition: React.FC<CbtSectionTransitionProps> = ({
  onStartReading,
}) => {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="max-w-xl w-full bg-white border border-slate-300 rounded-xl shadow-lg p-8 text-center space-y-6 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Section 1: Listening Completed
          </span>
          <h2 className="text-2xl font-bold text-slate-900">
            Hoàn thành phần thi Listening!
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Thời gian và audio của phần thi Nghe đã kết thúc
          </p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-600 p-5 text-left rounded-r-lg text-xs md:text-sm text-slate-700 space-y-2">
          <p className="font-bold text-blue-950 uppercase tracking-wide flex items-center space-x-1.5">
            <BookOpen className="w-4 h-4 text-blue-700" />
            <span>Hướng dẫn phần thi tiếp theo (Reading Section):</span>
          </p>
          <p>• Phần thi Đọc hiểu gồm <strong>100 câu hỏi (từ câu 101 đến câu 200)</strong>.</p>
          <p>• Thời gian làm bài độc lập: <strong>75 phút</strong> (đồng hồ đếm ngược phía trên).</p>
          <p>• Trong phần thi Reading, bạn có thể tự do chuyển câu, quay lại sửa đáp án và đánh dấu cờ (Flag) cho các câu chưa chắc chắn.</p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onStartReading}
            className="flex items-center justify-center space-x-2 px-8 py-3.5 bg-iig-navy hover:bg-blue-900 text-white font-bold rounded-lg shadow-md text-sm transition-all transform active:scale-95 mx-auto"
          >
            <span>Bắt đầu phần thi Reading (75:00)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
