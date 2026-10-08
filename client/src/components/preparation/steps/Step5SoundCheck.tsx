import React, { useState, useEffect, useRef } from 'react';
import { Headphones, Volume2, VolumeX, Play, Square, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useExamSessionStore } from '../../../store/useExamSessionStore';

export const Step5SoundCheck: React.FC = () => {
  const { config, setSoundVerified } = useExamSessionStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Play realistic chime / speech simulation using Web Audio API or SpeechSynthesis
  const stopAudio = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch {
        // ignore
      }
      oscillatorRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const playSoundSample = () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    try {
      // 1. Web Audio Chime Melody
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const gain = ctx.createGain();
      gain.gain.value = volume / 100 * 0.3; // safe gain
      gain.connect(ctx.destination);
      gainNodeRef.current = gain;

      // Play short pleasant three-tone chime (ETS signature intro vibe)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.2); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.4); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.6); // C6
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 1.2);
      oscillatorRef.current = osc;

      setIsPlaying(true);

      // 2. Also speak TOEIC instruction prompt if SpeechSynthesis is available
      if ('speechSynthesis' in window) {
        setTimeout(() => {
          const text = "This is a TOEIC listening audio check. If you can hear this message clearly, adjust your volume and proceed to the exam.";
          const utter = new SpeechSynthesisUtterance(text);
          utter.lang = 'en-US';
          utter.rate = 0.95;
          utter.volume = volume / 100;
          utter.onend = () => setIsPlaying(false);
          utter.onerror = () => setIsPlaying(false);
          window.speechSynthesis.speak(utter);
        }, 1100);
      } else {
        setTimeout(() => setIsPlaying(false), 1500);
      }
    } catch (e) {
      console.warn("Audio test fallback:", e);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Update gain if volume changes while playing
  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime((volume / 100) * 0.3, audioContextRef.current.currentTime);
    }
  }, [volume]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          Bước 5: Kiểm tra tai nghe & âm thanh (Sound Check)
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Đảm bảo bạn đeo tai nghe đúng chuẩn và nghe rõ âm lượng trước khi bước vào phần thi Listening.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-8">
        {/* Main Audio Test Box */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center space-x-5 z-10">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
              isPlaying
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 animate-pulse'
                : 'bg-white/10 text-blue-400 border border-white/10'
            }`}>
              <Headphones className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">ETS CBT Audio Calibration</span>
                {isPlaying && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                    Đang phát âm thanh...
                  </span>
                )}
              </div>
              <h3 className="text-lg md:text-xl font-black text-white mt-0.5">
                Kiểm tra chất lượng phát âm TOEIC
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                Bấm nút bên dưới để nghe mẫu giọng đọc chuẩn ETS cùng chuông báo hiệu chuyển câu.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="z-10 w-full md:w-auto flex flex-col items-center">
            <button
              type="button"
              onClick={playSoundSample}
              className={`w-full md:w-auto px-6 py-3.5 rounded-xl font-bold flex items-center justify-center space-x-2.5 transition-all shadow-md ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 hover:scale-[1.02]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-5 h-5 fill-current" />
                  <span>Dừng nghe thử</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Phát âm thanh mẫu</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Volume Slider & Animated Sound Equalizer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
          {/* Slider */}
          <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
              <span className="flex items-center space-x-2">
                {volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
                <span>Điều chỉnh âm lượng</span>
              </span>
              <span className="text-blue-600 font-extrabold text-sm">{volume}%</span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setVolume((v) => (v === 0 ? 80 : 0))}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="Bật/Tắt âm"
              >
                {volume === 0 ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-slate-700" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Khuyến nghị đặt mức 70% - 85% để tránh mỏi tai trong 45 phút thi Listening.
            </p>
          </div>

          {/* Equalizer animation */}
          <div className="flex items-center justify-center p-5 bg-slate-50 rounded-xl border border-slate-200 space-x-1.5 h-full">
            {[40, 75, 55, 90, 65, 80, 45, 100, 70, 85, 60, 40].map((h, i) => (
              <div
                key={i}
                className={`w-2.5 rounded-full transition-all duration-150 ${
                  isPlaying
                    ? 'bg-blue-600 animate-pulse'
                    : 'bg-slate-300'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(12, (h * volume) / 100)}px` : '10px',
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Verification Checkbox */}
        <div className="pt-4 border-t border-slate-200">
          <label className={`flex items-start space-x-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
            config.isSoundVerified
              ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
          }`}>
            <input
              type="checkbox"
              checked={config.isSoundVerified}
              onChange={(e) => setSoundVerified(e.target.checked)}
              className="mt-1 w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <div>
              <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <span>Tôi đã kiểm tra và xác nhận âm thanh rõ ràng</span>
                {config.isSoundVerified && <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                (Bắt buộc đánh dấu để tiếp tục vào phòng thi. Nếu tai nghe không phát âm thanh, vui lòng kiểm tra giắc cắm hoặc bật loa máy tính).
              </p>
            </div>
          </label>
        </div>

        {/* Troubleshooting Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1.5">
          <div className="font-bold flex items-center space-x-1.5 text-amber-800">
            <AlertTriangle className="w-4 h-4" />
            <span>Mẹo khắc phục nếu không nghe thấy âm thanh:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-amber-800/90 text-[11px]">
            <li>Kiểm tra nút âm lượng vật lý trên tai nghe hoặc bàn phím máy tính.</li>
            <li>Đảm bảo trình duyệt không bị tắt âm thanh (biểu tượng loa trên tab trình duyệt).</li>
            <li>Trình duyệt có thể chặn tự động phát âm thanh — hãy nhấn nút <strong>"Phát âm thanh mẫu"</strong> một lần nữa.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
