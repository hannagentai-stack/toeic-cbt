import React from 'react';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { useReadingStore } from '../../../store/useReadingStore';

export const FiveMinAlertModal: React.FC = () => {
  const { dismissFiveMinAlert } = useReadingStore();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-amber-300 overflow-hidden transform transition-all animate-in fade-in zoom-in-95">
        <div className="bg-amber-500 text-white p-6 flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0 animate-bounce">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">CẢNH BÁO: CHỈ CÒN 5 PHÚT!</h3>
            <p className="text-xs text-amber-100 mt-0.5">Thời gian làm bài sắp kết thúc</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 text-sm leading-relaxed space-y-2">
            <p className="font-bold flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Thí sinh lưu ý:</span>
            </p>
            <p>
              1. Hãy dùng <strong>Bảng câu hỏi bên phải</strong> để kiểm tra lại các câu còn bỏ trống màu trắng.
            </p>
            <p>
              2. Rà soát các câu đã đánh dấu cờ 🚩 để chốt đáp án cuối cùng.
            </p>
            <p>
              3. Khi đồng hồ đếm ngược về <strong>00:00</strong>, hệ thống sẽ tự động thu bài và đóng phòng thi.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={dismissFiveMinAlert}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold rounded-xl shadow-md transition-all text-sm"
            >
              <span>Đã hiểu, tiếp tục làm bài</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
