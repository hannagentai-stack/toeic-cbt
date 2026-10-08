import React, { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  X,
  ShieldCheck,
  HardDriveDownload,
} from 'lucide-react';
import { mediaService, type PreloadAudioItem, type PreloadProgress } from '../../services/mediaService';
import type { ExamData } from '../../types/exam';

interface ExamAudioPreloaderModalProps {
  isOpen: boolean;
  examData: ExamData;
  onComplete: () => void;
  onCancel: () => void;
}

export const ExamAudioPreloaderModal: React.FC<ExamAudioPreloaderModalProps> = ({
  isOpen,
  examData,
  onComplete,
  onCancel,
}) => {
  const [items, setItems] = useState<PreloadAudioItem[]>([]);
  const [progress, setProgress] = useState<PreloadProgress>({
    currentItemTitle: 'Đang chuẩn bị danh sách âm thanh...',
    loadedCount: 0,
    totalCount: 0,
    percentage: 0,
    totalBytes: 0,
    failedCount: 0,
  });
  const [failedItems, setFailedItems] = useState<{ item: PreloadAudioItem; error: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const startPreloading = async (preloadList: PreloadAudioItem[]) => {
    if (preloadList.length === 0) {
      setIsCompleted(true);
      onComplete();
      return;
    }

    setIsLoading(true);
    setFailedItems([]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const result = await mediaService.preloadListeningAudios(
      preloadList,
      (p) => setProgress(p),
      controller.signal
    );

    setIsLoading(false);

    if (result.success) {
      setIsCompleted(true);
      setProgress((prev) => ({
        ...prev,
        percentage: 100,
        loadedCount: result.totalCount,
        currentItemTitle: 'Toàn bộ âm thanh đã sẵn sàng!',
      }));
    } else {
      setIsCompleted(false);
      setFailedItems(result.failedItems);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      return;
    }

    const audioItems = mediaService.extractListeningAudioItems(examData);
    setItems(audioItems);

    if (audioItems.length === 0) {
      onComplete();
      return;
    }

    startPreloading(audioItems);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen, examData]);

  if (!isOpen) return null;

  const handleRetryFailed = () => {
    if (failedItems.length > 0) {
      const retryList = failedItems.map((f) => f.item);
      startPreloading(retryList);
    } else {
      startPreloading(items);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const isBlocked = failedItems.length > 0 || !isCompleted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl ring-1 ring-white/10 relative overflow-hidden">
        {/* Glow hiệu ứng nền */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Nút đóng / hủy */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer z-10"
          title="Hủy bỏ và quay lại"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-4 mb-5 relative z-10">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
              isCompleted
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                : failedItems.length > 0
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                : 'bg-blue-600/20 border border-blue-500/40 text-blue-400 animate-pulse'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            ) : failedItems.length > 0 ? (
              <AlertTriangle className="w-7 h-7 text-rose-400" />
            ) : (
              <Headphones className="w-7 h-7 text-blue-400" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-400">
                TỐI ƯU HÓA TRẢI NGHIỆM THI MÁY CBT
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                In-Memory Cache
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-black text-white mt-0.5">
              Tải trước âm thanh bài thi Listening
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hệ thống tải toàn bộ audio vào RAM để phòng thi mượt mà 100%, không giật lag do mạng chậm.
            </p>
          </div>
        </div>

        {/* Thanh tiến trình Progress Bar */}
        <div className="space-y-2 mb-5 relative z-10">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 font-semibold truncate max-w-xs">
              {progress.currentItemTitle}
            </span>
            <span className="font-black text-sky-400 text-sm">
              {progress.percentage}%
            </span>
          </div>

          <div className="w-full bg-slate-800/90 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                failedItems.length > 0
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : 'bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400'
              }`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
            <div className="flex items-center space-x-1.5">
              <HardDriveDownload className="w-3.5 h-3.5 text-blue-400" />
              <span>
                Đã nạp: <strong className="text-white">{progress.loadedCount}</strong>/{items.length} file audio
              </span>
            </div>
            <span>Dung lượng: <strong className="text-slate-200">{formatBytes(progress.totalBytes)}</strong></span>
          </div>
        </div>

        {/* Thông báo hoàn thành thành công */}
        {isCompleted && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-3 mb-6 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-emerald-200">✓ Sẵn sàng 100% âm thanh trong bộ nhớ máy</p>
              <p className="text-[11px] text-emerald-400/90 mt-0.5">
                Các file audio đã được mã hóa và lưu trữ an toàn trong phiên thi. Bài thi sẽ phát tức thì mà không cần tải lại.
              </p>
            </div>
          </div>
        )}

        {/* Thông báo lỗi nếu có file tải thất bại */}
        {failedItems.length > 0 && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2 mb-6 animate-in fade-in">
            <div className="flex items-center space-x-2 font-bold text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Lỗi tải âm thanh: {failedItems.length} file không thể tải về</span>
            </div>
            <p className="text-[11px] text-rose-300/90 leading-relaxed">
              Quy chế thi máy yêu cầu toàn bộ audio phải được tải trọn vẹn trước khi bắt đầu để không làm gián đoạn bài làm của bạn.
            </p>
            <div className="max-h-24 overflow-y-auto space-y-1 bg-black/30 p-2 rounded-xl text-[10px] font-mono">
              {failedItems.map((f, idx) => (
                <div key={idx} className="text-rose-400 truncate">
                  • {f.item.title}: {f.error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quy chế an toàn */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2.5 mb-6">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Khóa bắt đầu bài thi khi chưa đủ âm thanh: Đảm bảo quyền lợi điểm số của thí sinh trong trường hợp mạng giật lag.
          </span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Quay lại
          </button>

          <div className="flex items-center space-x-3">
            {failedItems.length > 0 && (
              <button
                type="button"
                onClick={handleRetryFailed}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Thử lại tải file lỗi</span>
              </button>
            )}

            <button
              type="button"
              onClick={onComplete}
              disabled={isBlocked}
              className={`px-6 py-2.5 rounded-xl text-xs font-black flex items-center space-x-2 shadow-lg transition-all ${
                isBlocked
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 shadow-none'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 hover:scale-105 active:scale-95 cursor-pointer'
              }`}
            >
              <span>{isCompleted ? 'VÀO PHÒNG THI CBT' : 'Đang tải âm thanh...'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
