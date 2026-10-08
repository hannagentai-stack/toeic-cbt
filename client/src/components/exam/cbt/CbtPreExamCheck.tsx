import React, { useState } from 'react';
import { Volume2, CheckCircle2, Headphones, ShieldCheck, ArrowRight } from 'lucide-react';

interface CbtPreExamCheckProps {
  candidateName: string;
  candidateId: string;
  testTitle: string;
  onEnterExam: () => void;
}

export const CbtPreExamCheck: React.FC<CbtPreExamCheckProps> = ({
  candidateName,
  candidateId,
  testTitle,
  onEnterExam,
}) => {
  const [isPlayingTestTone, setIsPlayingTestTone] = useState(false);
  const [tonePlayed, setTonePlayed] = useState(false);
  const [testVolume, setTestVolume] = useState(0.8);

  const handleTestAudio = () => {
    setIsPlayingTestTone(true);
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // Standard 440 Hz
      gain.gain.setValueAtTime(testVolume * 0.35, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
      setTimeout(() => {
        setIsPlayingTestTone(false);
        setTonePlayed(true);
      }, 900);
    } catch {
      setIsPlayingTestTone(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="max-w-2xl w-full bg-white border border-slate-300 rounded-xl shadow-md overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header IIG CBT */}
        <div className="bg-iig-navy text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-wide uppercase">
              Kỳ thi TOEIC CBT — Kiểm tra thiết bị &amp; Tai nghe
            </h2>
            <p className="text-xs text-slate-300">
              ETS / IIG Vietnam Computer-Based Testing System
            </p>
          </div>
          <div className="px-3 py-1 bg-white/10 rounded text-xs font-mono font-bold border border-white/20">
            CBT-ROOM
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Bảng thông tin thí sinh */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm">
            <div>
              <span className="text-slate-500 block">Họ và tên thí sinh:</span>
              <strong className="text-slate-900 font-bold uppercase">{candidateName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Số báo danh (Candidate ID):</span>
              <strong className="text-blue-900 font-mono font-bold">{candidateId}</strong>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500 block">Đề thi:</span>
              <strong className="text-slate-900">{testTitle}</strong>
            </div>
          </div>

          {/* Hộp kiểm tra tai nghe với audio mẫu */}
          <div className="border-2 border-dashed border-blue-200 rounded-xl p-5 bg-blue-50/50 space-y-4">
            <div className="flex items-center space-x-2 text-blue-900 font-bold text-sm">
              <Headphones className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span>Kiểm tra âm lượng tai nghe (Sound Check)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hãy đeo tai nghe và bấm nút <strong>&quot;Phát âm thanh mẫu&quot;</strong> để nghe âm thử. Điều chỉnh thanh âm lượng bên dưới sao cho nghe to, rõ ràng và thoải mái nhất.
            </p>

            {/* Điều chỉnh âm lượng thanh kéo */}
            <div className="bg-white/80 border border-blue-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs font-medium text-slate-700">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span>Âm lượng thử:</span>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={testVolume}
                  onChange={(e) => setTestVolume(parseFloat(e.target.value))}
                  className="w-32 md:w-44 accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                />
                <span className="text-xs font-mono font-bold text-blue-900 w-10 text-right">
                  {Math.round(testVolume * 100)}%
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleTestAudio}
                className={`px-4 py-2.5 text-xs font-bold rounded-lg shadow-sm flex items-center space-x-2 transition-all ${
                  isPlayingTestTone
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : 'bg-blue-700 hover:bg-blue-800 text-white'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>{isPlayingTestTone ? 'Đang phát âm thử 440Hz...' : 'Phát âm thanh mẫu (Audio Sample)'}</span>
              </button>

              <div className="text-xs font-medium">
                {tonePlayed ? (
                  <span className="text-emerald-700 font-bold flex items-center space-x-1.5 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Đã nghe rõ âm thanh</span>
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                    Chưa kiểm tra tai nghe
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quy chế bắt buộc */}
          <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center space-x-2 font-bold text-slate-800 text-xs mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Xác nhận trước khi vào thi:</span>
            </div>
            <p>• Tai nghe và thiết bị chuột, bàn phím hoạt động bình thường.</p>
            <p>• Phần thi Listening diễn ra trước (100 câu), audio chỉ phát 1 lần không thể tạm dừng.</p>
            <p>• Nghiêm cấm thoát khỏi giao diện thi hoặc mở các phần mềm khác.</p>
          </div>

          {/* Nút vào phòng thi */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            {!tonePlayed ? (
              <span className="text-xs text-rose-600 font-medium animate-pulse">
                * Vui lòng bấm &quot;Phát âm thanh mẫu&quot; để kiểm tra tai nghe trước khi vào thi.
              </span>
            ) : (
              <span className="text-xs text-emerald-600 font-medium">
                ✓ Thiết bị âm thanh đã sẵn sàng.
              </span>
            )}

            <button
              type="button"
              onClick={onEnterExam}
              disabled={!tonePlayed}
              className={`flex items-center space-x-2 px-8 py-3 text-white font-bold rounded-lg shadow text-sm transition-all transform ${
                tonePlayed
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-75'
              }`}
            >
              <span>Xác nhận &amp; Vào phòng thi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
