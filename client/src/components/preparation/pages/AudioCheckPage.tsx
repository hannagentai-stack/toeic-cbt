import React, { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  Volume2,
  VolumeX,
  Play,
  Square,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useExamSessionStore } from '../../../store/useExamSessionStore';

interface AudioCheckPageProps {
  onBack: () => void;
  onNext: () => void;
}

export const AudioCheckPage: React.FC<AudioCheckPageProps> = ({ onBack, onNext }) => {
  const { config, setSoundVerified } = useExamSessionStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedSample, setHasPlayedSample] = useState(false);
  const [volume, setVolume] = useState(80);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const stopAudio = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch {}
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

    setErrorMessage(null);
    setHasPlayedSample(true);

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const gain = ctx.createGain();
      gain.gain.value = (volume / 100) * 0.3;
      gain.connect(ctx.destination);
      gainNodeRef.current = gain;

      // 4 nốt chime ETS quen thuộc
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.2);
      osc.frequency.setValueAtTime(783.99, now + 0.4);
      osc.frequency.setValueAtTime(1046.5, now + 0.6);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 1.2);
      oscillatorRef.current = osc;

      setIsPlaying(true);

      // Phát thông điệp giọng đọc tiếng Anh
      if ('speechSynthesis' in window) {
        setTimeout(() => {
          const text = 'This is a sound check for the TOEIC listening test. If you can hear this audio clearly, please confirm to proceed.';
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
    } catch {
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

  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime((volume / 100) * 0.3, audioContextRef.current.currentTime);
    }
  }, [volume]);

  const handleConfirmSound = () => {
    setSoundVerified(true);
    setErrorMessage(null);
  };

  const handleProceed = () => {
    if (!hasPlayedSample) {
      setErrorMessage('Bạn phải bấm "Phát audio mẫu" để kiểm tra tai nghe trước khi tiếp tục.');
      return;
    }

    if (!config.isSoundVerified) {
      setErrorMessage('Vui lòng bấm nút "Tôi nghe rõ" để xác nhận chất lượng âm thanh.');
      return;
    }

    onNext();
  };

  const isVerified = Boolean(config.isSoundVerified && hasPlayedSample);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Kiểm tra thiết bị ngoại vi</span>
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          Kiểm tra tai nghe & Âm lượng (Audio Check)
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Đảm bảo tai nghe hoạt động tốt và âm lượng vừa vặn trước khi bắt đầu phần thi Listening.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-7">
        {/* Hộp phát âm thanh chính */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center space-x-5 z-10">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                isPlaying
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 animate-pulse'
                  : 'bg-white/10 text-sky-400 border border-white/10'
              }`}
            >
              <Headphones className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                  ETS CBT Sound Calibration
                </span>
                {isPlaying && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                    Đang phát âm thanh...
                  </span>
                )}
              </div>
              <h3 className="text-lg md:text-xl font-black text-white mt-0.5">
                Nghe thử âm thanh mẫu bài thi
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                Bấm nút bên dưới để nghe chuỗi chuông tín hiệu và giọng đọc hướng dẫn mẫu của giám thị ETS.
              </p>
            </div>
          </div>

          {/* Nút Phát audio mẫu */}
          <div className="z-10 w-full md:w-auto flex flex-col items-center">
            <button
              type="button"
              onClick={playSoundSample}
              className={`w-full md:w-auto px-6 py-3.5 rounded-xl font-bold flex items-center justify-center space-x-2.5 transition-all shadow-md cursor-pointer ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-5 h-5 fill-current" />
                  <span>Dừng audio</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Phát audio mẫu</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Thanh điều chỉnh âm lượng & Visual Equalizer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Thanh trượt âm lượng */}
          <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
              <span className="flex items-center space-x-2">
                {volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
                <span>Thanh âm lượng:</span>
              </span>
              <span className="text-blue-600 font-mono font-extrabold text-sm">{volume}%</span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setVolume((v) => (v === 0 ? 80 : 0))}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title="Bật/Tắt tiếng"
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
              Khuyến nghị đặt mức 70% - 85% để nghe rõ cả giọng phát âm Anh - Mỹ, Anh - Úc.
            </p>
          </div>

          {/* Sóng Equalizer */}
          <div className="flex items-center justify-center p-5 bg-slate-50 rounded-xl border border-slate-200 space-x-1.5 h-full">
            {[35, 70, 50, 95, 60, 85, 40, 100, 75, 90, 55, 35].map((h, i) => (
              <div
                key={i}
                className={`w-2.5 rounded-full transition-all duration-150 ${
                  isPlaying ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(10, (h * volume) / 100)}px` : '10px',
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Nút "Tôi nghe rõ" */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="text-left">
            <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <span>Xác nhận chất lượng âm thanh</span>
              {isVerified && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Sau khi nghe rõ âm thanh mẫu, hãy bấm nút xác nhận để mở khóa quyền vào thi.
            </p>
          </div>

          <button
            type="button"
            onClick={handleConfirmSound}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer shadow-sm ${
              isVerified
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 hover:border-slate-400'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{isVerified ? '✓ Đã xác nhận: Tôi nghe rõ' : 'Tôi nghe rõ'}</span>
          </button>
        </div>

        {/* Thông báo lỗi nếu chưa nghe thử hoặc chưa xác nhận */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Điều hướng */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        <button
          type="button"
          onClick={handleProceed}
          className={`px-8 py-3 rounded-xl font-bold text-sm flex items-center space-x-2 shadow-md transition-all cursor-pointer ${
            isVerified
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-slate-300 text-slate-500 hover:bg-slate-400 hover:text-slate-800'
          }`}
        >
          <span>Tiếp tục sang Hướng dẫn</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
