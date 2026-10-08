import React from 'react';
import { Award, Headphones, Sliders, RotateCcw, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import type { ExamMode } from '../../../types/session';
import { useExamSessionStore } from '../../../store/useExamSessionStore';

interface ModeCard {
  id: ExamMode;
  title: string;
  oneLineDesc: string;
  duration: string;
  badgeLabel: 'Giống thi thật' | 'Linh hoạt';
  badgeType: 'real' | 'flexible';
  icon: React.ReactNode;
  accentBg: string;
  accentBorder: string;
}

const MODES: ModeCard[] = [
  {
    id: 'full',
    title: 'Thi thử đầy đủ (Full Test)',
    oneLineDesc: 'Thi đúng 120 phút với đầy đủ 200 câu hỏi chuẩn format đề thi thật ETS.',
    duration: '120 phút • 200 câu (Listening + Reading)',
    badgeLabel: 'Giống thi thật',
    badgeType: 'real',
    icon: <Award className="w-7 h-7 text-emerald-600" />,
    accentBg: 'hover:bg-emerald-50/40',
    accentBorder: 'hover:border-emerald-500',
  },
  {
    id: 'skill',
    title: 'Thi theo kỹ năng (Skill Test)',
    oneLineDesc: 'Thi tập trung 1 kỹ năng Listening (45 phút) hoặc Reading (75 phút) theo chuẩn ETS.',
    duration: '45 phút (Listening) hoặc 75 phút (Reading)',
    badgeLabel: 'Giống thi thật',
    badgeType: 'real',
    icon: <Headphones className="w-7 h-7 text-sky-600" />,
    accentBg: 'hover:bg-sky-50/40',
    accentBorder: 'hover:border-sky-500',
  },
  {
    id: 'practice',
    title: 'Luyện theo Part (Part Practice)',
    oneLineDesc: 'Tự chọn các Part cần củng cố, tùy chỉnh thời gian và xem giải thích ngay.',
    duration: 'Tùy chỉnh thời gian • Chọn tự do Part 1 - 7',
    badgeLabel: 'Linh hoạt',
    badgeType: 'flexible',
    icon: <Sliders className="w-7 h-7 text-indigo-600" />,
    accentBg: 'hover:bg-indigo-50/40',
    accentBorder: 'hover:border-indigo-500',
  },
  {
    id: 'review-wrong',
    title: 'Ôn lại câu sai (Mistake Review)',
    oneLineDesc: 'Lọc tự động các câu bạn đã làm sai từ các bài thi trước để ôn luyện lại.',
    duration: 'Tự do theo số câu sai • Bật nghe lại & giải thích',
    badgeLabel: 'Linh hoạt',
    badgeType: 'flexible',
    icon: <RotateCcw className="w-7 h-7 text-amber-600" />,
    accentBg: 'hover:bg-amber-50/40',
    accentBorder: 'hover:border-amber-500',
  },
];

interface ModeSelectPageProps {
  onNext: () => void;
}

export const ModeSelectPage: React.FC<ModeSelectPageProps> = ({ onNext }) => {
  const { config, setMode } = useExamSessionStore();

  const handleSelectMode = (mode: ExamMode) => {
    setMode(mode);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bước 1: Chọn hình thức làm bài</span>
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          Chọn chế độ thi TOEIC CBT
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Hệ thống cung cấp 4 chế độ chuyên biệt từ mô phỏng phòng thi thật đến luyện tập tự do.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MODES.map((item) => {
          const isSelected = config.mode === item.id;

          return (
            <div
              key={item.id}
              onClick={() => handleSelectMode(item.id)}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative group ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-300 transform scale-[1.01]'
                  : `bg-white border-slate-200 shadow-sm ${item.accentBg} ${item.accentBorder}`
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 group-hover:bg-white'
                    }`}
                  >
                    {item.icon}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Badge Giống thi thật / Linh hoạt */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center space-x-1 border ${
                        item.badgeType === 'real'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                      }`}
                    >
                      {item.badgeType === 'real' && <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />}
                      <span>{item.badgeLabel}</span>
                    </span>

                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
                  {item.oneLineDesc}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="font-mono text-slate-500">{item.duration}</span>
                <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-700'}`}>
                  {isSelected ? 'Đã chọn ✓' : 'Bấm để chọn'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={onNext}
          className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center space-x-2 shadow-md shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Tiếp tục sang Chọn đề</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
