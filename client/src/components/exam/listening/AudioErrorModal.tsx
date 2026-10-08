import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';

interface AudioErrorModalProps {
  errorMessage: string;
  onRetry: () => void;
}

export const AudioErrorModal: React.FC<AudioErrorModalProps> = ({ errorMessage, onRetry }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95">
        <div className="bg-rose-50 border-b border-rose-100 p-6 flex items-center space-x-3 text-rose-800">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Lỗi tải dữ liệu âm thanh</h3>
            <p className="text-xs text-rose-600">Phần mềm thi chưa thể nạp file nghe</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            {errorMessage}
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center space-x-2 font-semibold text-slate-700">
              <WifiOff className="w-4 h-4 text-slate-500" />
              <span>Gợi ý khắc phục:</span>
            </div>
            <p>1. Kiểm tra lại kết nối mạng Internet hoặc Wifi của bạn.</p>
            <p>2. Đảm bảo âm lượng thiết bị/tai nghe đang mở.</p>
            <p>3. Bấm nút <strong>"Thử lại"</strong> bên dưới để hệ thống nạp lại audio.</p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onRetry}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-iig-accent hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử lại nạp âm thanh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
