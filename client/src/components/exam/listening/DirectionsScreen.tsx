import React, { useState } from 'react';
import { Volume2, Play, AlertTriangle, Headphones } from 'lucide-react';
import type { PartInfo } from '../../../types/exam';
import { useListeningStore } from '../../../store/useListeningStore';

interface DirectionsScreenProps {
  part: PartInfo;
  onStart: () => void;
}

export const DirectionsScreen: React.FC<DirectionsScreenProps> = ({ part, onStart }) => {
  const { volume, setVolume } = useListeningStore();
  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);

  // Phát âm thanh mẫu để thí sinh test tai nghe
  const handleTestAudio = () => {
    setIsPlayingTestSound(true);
    // Sử dụng Web Audio API để tạo âm thanh kiểm tra 'beep' nếu chưa có file MP3 mẫu
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // Note D5
      gain.gain.setValueAtTime(volume * 0.3, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
      setTimeout(() => setIsPlayingTestSound(false), 700);
    } catch {
      setIsPlayingTestSound(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8 bg-white border border-slate-300 rounded-xl shadow-lg overflow-hidden">
      {/* Header chuẩn CBT IIG */}
      <div className="bg-gradient-to-r from-iig-navy via-iig-dark to-iig-blue text-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-block px-3 py-1 bg-white/20 text-xs font-semibold tracking-wider rounded uppercase mb-2">
              Listening Test Section
            </span>
            <h1 className="text-2xl font-bold tracking-tight">
              Part {part.part_number}: {part.name}
            </h1>
          </div>
          <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-lg border border-white/20">
            <Headphones className="w-5 h-5 text-sky-300" />
            <span className="text-sm font-medium">Quy chuẩn thi máy IIG</span>
          </div>
        </div>
      </div>

      {/* Nội dung Directions */}
      <div className="p-8 space-y-6">
        <div className="bg-slate-50 border-l-4 border-iig-accent p-5 rounded-r-lg">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide mb-2">
            Directions
          </h2>
          <p className="text-slate-700 leading-relaxed text-justify whitespace-pre-line text-sm md:text-base">
            {part.directions_text}
          </p>
        </div>

        {/* Hướng dẫn chi tiết theo từng Part */}
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-lg p-5">
          <h3 className="font-semibold text-blue-900 text-sm uppercase tracking-wide mb-3 flex items-center">
            <span className="w-2 h-2 rounded-full bg-blue-600 mr-2"></span>
            Đặc điểm bài thi Part {part.part_number}:
          </h3>
          <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
            {part.part_number === 1 && (
              <>
                <li>Bạn sẽ nhìn 1 bức ảnh và nghe 4 câu mô tả <strong>(A), (B), (C), (D)</strong>.</li>
                <li>Câu mô tả <strong>KHÔNG</strong> được in trên màn hình thi.</li>
                <li>Hãy bấm chọn đáp án miêu tả đúng nhất những gì bạn thấy trong ảnh.</li>
              </>
            )}
            {part.part_number === 2 && (
              <>
                <li>Bạn sẽ nghe 1 câu hỏi/phát biểu và 3 câu phản hồi <strong>(A), (B), (C)</strong>.</li>
                <li>Màn hình <strong>KHÔNG</strong> hiển thị văn bản câu hỏi hay câu trả lời.</li>
                <li>Part 2 chỉ có 3 lựa chọn, không có lựa chọn (D).</li>
              </>
            )}
            {part.part_number === 3 && (
              <>
                <li>Bạn sẽ nghe đoạn hội thoại giữa 2 hoặc 3 người.</li>
                <li>Mỗi đoạn tương ứng với <strong>3 câu hỏi con</strong> hiển thị cùng lúc trên màn hình.</li>
                <li>Hãy đọc lướt câu hỏi trước và chọn đáp án trong lúc nghe.</li>
              </>
            )}
            {part.part_number === 4 && (
              <>
                <li>Bạn sẽ nghe bài nói ngắn từ một người phát biểu duy nhất (thông báo, tin tức...).</li>
                <li>Mỗi bài nói kèm theo <strong>3 câu hỏi con</strong>. Có thể kèm biểu đồ hoặc bảng thông tin.</li>
                <li>Mỗi bài nói chỉ được phát duy nhất 1 lần.</li>
              </>
            )}
          </ul>
        </div>

        {/* Thanh kiểm tra tai nghe & âm lượng */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <Volume2 className="w-5 h-5 text-slate-600 flex-shrink-0" />
            <span className="text-sm font-medium text-slate-700">Âm lượng tai nghe:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-32 accent-iig-accent cursor-pointer"
            />
            <span className="text-xs text-slate-500 font-mono w-8">
              {Math.round(volume * 100)}%
            </span>
          </div>

          <button
            type="button"
            onClick={handleTestAudio}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center space-x-1.5 ${
              isPlayingTestSound
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>{isPlayingTestSound ? 'Đang phát âm thử...' : 'Thử âm thanh tai nghe'}</span>
          </button>
        </div>

        {/* Cảnh báo nghiêm ngặt chế độ thi thật IIG */}
        <div className="flex items-start space-x-3 bg-amber-50 border border-amber-300/80 p-4 rounded-lg text-amber-900 text-xs md:text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">Quy tắc bắt buộc trong phòng thi:</p>
            <p>
              1. Audio phát <strong>đúng 1 lần</strong>, không thể tạm dừng, tua lại hay phát lại.<br />
              2. Sau khi audio kết thúc sẽ có khoảng im lặng để tô đáp án, sau đó hệ thống sẽ <strong>tự động chuyển câu và khóa vĩnh viễn</strong> câu đã làm.
            </p>
          </div>
        </div>

        {/* Nút bấm Bắt đầu Part */}
        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={onStart}
            className="flex items-center space-x-2 px-8 py-3.5 bg-iig-accent hover:bg-blue-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95 text-base"
          >
            <span>Bắt đầu Part {part.part_number}</span>
            <Play className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
