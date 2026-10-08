import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Pin, Volume2, RotateCcw } from 'lucide-react';

interface AudioTimestampPickerProps {
  audioUrl?: string | null;
  currentTimestamp?: number | null;
  onSelectTimestamp: (seconds: number) => void;
}

export const AudioTimestampPicker: React.FC<AudioTimestampPickerProps> = ({
  audioUrl,
  currentTimestamp,
  onSelectTimestamp,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => setDuration(audio.duration || 0);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onended = () => setIsPlaying(false);

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (timeSec: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = timeSec;
    setCurrentTime(timeSec);
  };

  const handlePinCurrentTime = () => {
    const pinned = Math.round(currentTime * 10) / 10; // làm tròn 1 chữ số thập phân
    onSelectTimestamp(pinned);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="bg-slate-50 border border-slate-300 rounded-xl p-3.5 space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-700 flex items-center space-x-1.5">
          <Volume2 className="w-4 h-4 text-iig-accent" />
          <span>Bộ đặt Timestamp âm thanh tự động:</span>
        </span>
        {currentTimestamp !== null && currentTimestamp !== undefined && (
          <span className="bg-blue-100 text-blue-800 font-mono font-bold px-2 py-0.5 rounded">
            Đã ghim: {currentTimestamp}s ({formatSeconds(currentTimestamp)})
          </span>
        )}
      </div>

      {audioUrl ? (
        <div className="space-y-2">
          {/* Thanh cuộn thời gian audio */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={togglePlay}
              className="w-7 h-7 rounded-full bg-iig-navy text-white flex items-center justify-center hover:bg-blue-900 transition-colors shadow-sm"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="flex-1 accent-iig-accent cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
            />

            <span className="font-mono text-slate-600 font-bold w-20 text-right">
              {formatSeconds(currentTime)}
            </span>
          </div>

          {/* Nút bấm ghim mốc giây hiện tại */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handlePinCurrentTime}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-lg shadow-sm transition-all"
            >
              <Pin className="w-3.5 h-3.5" />
              <span>Ghim giây này làm mốc bắt đầu câu</span>
            </button>

            {currentTimestamp !== null && currentTimestamp !== undefined && (
              <button
                type="button"
                onClick={() => handleSeek(currentTimestamp)}
                className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Nhảy tới mốc đã ghim</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-slate-400 italic">
          (Chưa có link audio nguyên bài hoặc audio câu hỏi để nghe thử timestamp)
        </p>
      )}

      {/* Nhập số giây thủ công */}
      <div className="flex items-center space-x-2 pt-1 border-t border-slate-200">
        <span className="text-slate-500">Hoặc nhập số giây trực tiếp:</span>
        <input
          type="number"
          step="0.1"
          min="0"
          value={currentTimestamp ?? ''}
          onChange={(e) => onSelectTimestamp(parseFloat(e.target.value) || 0)}
          placeholder="Ví dụ: 12.5"
          className="w-24 px-2 py-1 rounded border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-blue-500 outline-none"
        />
        <span className="text-slate-400">giây</span>
      </div>
    </div>
  );
};
