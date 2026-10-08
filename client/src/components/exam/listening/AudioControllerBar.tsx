import React from 'react';
import { Volume2, VolumeX, ShieldAlert, Clock, Radio } from 'lucide-react';
import { useListeningStore } from '../../../store/useListeningStore';

interface AudioControllerBarProps {
  currentPart: number;
  questionNumberText: string;
  isPlaying: boolean;
  isPreloading: boolean;
  answeredCount?: number;
  totalListeningQuestions?: number;
}

export const AudioControllerBar: React.FC<AudioControllerBarProps> = ({
  currentPart,
  questionNumberText,
  isPlaying,
  isPreloading,
  answeredCount = 0,
  totalListeningQuestions = 100,
}) => {
  const { volume, setVolume, isMuted, toggleMute, phase, silenceRemaining } = useListeningStore();
  const progressPercent = totalListeningQuestions > 0 ? Math.round((answeredCount / totalListeningQuestions) * 100) : 0;

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white flex flex-col border-b border-slate-800 shadow-md select-none">
      <div className="px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Thông tin câu hỏi & Part hiện tại */}
        <div className="flex items-center space-x-2.5">
          <span className="bg-sky-500/20 text-sky-300 font-bold px-2.5 py-1 rounded text-xs tracking-wider border border-sky-400/30 uppercase">
            PART {currentPart}
          </span>
          <span className="text-sm md:text-base font-bold text-slate-100 font-mono bg-slate-800 px-2.5 py-1 rounded border border-slate-700 shadow-inner">
            {questionNumberText}
          </span>
        </div>

        {/* Trạng thái âm thanh & Chỉ báo luồng thi Listening */}
        <div className="flex items-center space-x-3">
          {isPlaying && (
            <div className="flex items-center space-x-2 bg-emerald-950/80 border border-emerald-500/50 px-3.5 py-1 rounded-full shadow-inner animate-in fade-in">
              {/* Visualizer giả lập sóng âm thanh đang phát */}
              <div className="flex items-end space-x-0.5 h-3.5 w-5">
                <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_100ms] h-2"></span>
                <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_300ms] h-3.5"></span>
                <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_200ms] h-2.5"></span>
                <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_400ms] h-1.5"></span>
              </div>
              <span className="text-xs font-bold text-emerald-300 tracking-wide uppercase">
                Đang nghe...
              </span>
            </div>
          )}

          {phase === 'SILENCE_COUNTDOWN' && silenceRemaining > 1 && (
            <div
              className={`flex items-center space-x-2 px-3.5 py-1 rounded-full border transition-all animate-pulse ${
                silenceRemaining <= 3
                  ? 'bg-rose-500/30 border-rose-500 text-rose-200 shadow-sm ring-1 ring-rose-400'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              }`}
            >
              <Clock className={`w-4 h-4 ${silenceRemaining <= 3 ? 'text-rose-400 animate-spin duration-700' : 'text-amber-400'}`} />
              <span className="text-xs font-bold tracking-wide">
                Chọn đáp án: <span className="font-mono text-sm text-white font-black">{String(silenceRemaining).padStart(2, '0')}s</span>
              </span>
            </div>
          )}

          {(isPreloading || (phase === 'SILENCE_COUNTDOWN' && silenceRemaining <= 1)) && (
            <div className="flex items-center space-x-2 bg-blue-950/80 border border-sky-400/50 text-sky-300 px-3.5 py-1 rounded-full text-xs font-bold animate-pulse shadow-inner">
              <Radio className="w-3.5 h-3.5 animate-spin" />
              <span>Chuẩn bị câu tiếp...</span>
            </div>
          )}

          {/* Huy hiệu khóa tua */}
          <div className="hidden lg:flex items-center space-x-1.5 text-slate-400 text-xs bg-slate-800/40 px-2.5 py-1 rounded border border-slate-800">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <span>Khóa tua</span>
          </div>
        </div>

        {/* Tiến độ và Điều chỉnh âm lượng */}
        <div className="flex items-center space-x-4">
          <span className="text-xs text-slate-300 hidden md:inline font-mono">
            Đã làm: <strong className="text-emerald-400">{answeredCount}/{totalListeningQuestions}</strong>
          </span>

          <div className="flex items-center space-x-2 border-l border-slate-800 pl-3">
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
              className="text-slate-300 hover:text-white transition-colors p-1"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-slate-300" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 md:w-24 accent-sky-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
            />
            <span className="text-xs text-slate-400 font-mono w-7 text-right hidden sm:inline">
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>
          </div>
        </div>
      </div>

      {/* THANH TIẾN ĐỘ (PROGRESS BAR) */}
      <div className="w-full bg-slate-800 h-1 overflow-hidden">
        <div
          className="bg-emerald-400 h-full transition-all duration-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  );
};

