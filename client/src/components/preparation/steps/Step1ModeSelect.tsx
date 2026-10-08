import React from 'react';
import { Award, Headphones, Layers, RotateCcw, CheckCircle2 } from 'lucide-react';
import type { ExamMode } from '../../../types/exam';
import { useExamSessionStore } from '../../../store/useExamSessionStore';

interface ModeOption {
  id: ExamMode;
  title: string;
  subtitle: string;
  duration: string;
  description: string;
  badge: string;
  icon: React.ReactNode;
  accentColor: string;
}

const MODES: ModeOption[] = [
  {
    id: 'full',
    title: 'Thi thử đầy đủ (Full Test)',
    subtitle: 'Listening + Reading • 120 phút',
    duration: '120 phút • 200 câu',
    description: 'Trải nghiệm sát kỳ thi thật nhất. Audio phát tự động 1 lần, chuyển tiếp giữa 2 phần thi và tính điểm chuẩn ETS 10 - 990.',
    badge: 'Khuyên dùng',
    icon: <Award className="w-6 h-6 text-emerald-600" />,
    accentColor: 'border-emerald-500 bg-emerald-50/40 text-emerald-950',
  },
  {
    id: 'skill',
    title: 'Thi theo kỹ năng (Skill Test)',
    subtitle: 'Chỉ Listening (45p) hoặc Chỉ Reading (75p)',
    duration: '45p hoặc 75p • 100 câu',
    description: 'Tập trung rèn luyện chuyên sâu 1 kỹ năng. Đúng quy chế thi thật, chấm điểm chuẩn theo thang điểm 5 - 495 của kỹ năng đó.',
    badge: 'Tập trung kỹ năng',
    icon: <Headphones className="w-6 h-6 text-sky-600" />,
    accentColor: 'border-sky-500 bg-sky-50/40 text-sky-950',
  },
  {
    id: 'practice',
    title: 'Luyện theo Part (Part Practice)',
    subtitle: 'Chọn 1 hoặc nhiều Part bất kỳ (Part 1 - 7)',
    duration: 'Tùy chỉnh thời gian',
    description: 'Lựa chọn các phần bạn cần củng cố (Part 5 từ vựng, Part 7 đọc hiểu...). Hỗ trợ xem giải thích ngay và nghe lại audio.',
    badge: 'Linh hoạt cao',
    icon: <Layers className="w-6 h-6 text-indigo-600" />,
    accentColor: 'border-indigo-500 bg-indigo-50/40 text-indigo-950',
  },
  {
    id: 'review-wrong',
    title: 'Ôn lại câu sai (Mistake Retry)',
    subtitle: 'Lấy các câu đã làm sai từ lịch sử thi',
    duration: 'Tự do / 1 phút mỗi câu',
    description: 'Hệ thống tự động lọc ra những câu hỏi bạn từng chọn sai ở các lần thi trước để làm lại cho đến khi nắm vững 100%.',
    badge: 'Khắc phục điểm yếu',
    icon: <RotateCcw className="w-6 h-6 text-amber-600" />,
    accentColor: 'border-amber-500 bg-amber-50/40 text-amber-950',
  },
];

export const Step1ModeSelect: React.FC = () => {
  const { config, setMode } = useExamSessionStore();

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          Bước 1: Chọn chế độ làm bài
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Chọn mục tiêu luyện tập phù hợp với quỹ thời gian và nhu cầu của bạn hôm nay.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODES.map((mode) => {
          const isSelected = config.mode === mode.id;

          return (
            <div
              key={mode.id}
              onClick={() => setMode(mode.id)}
              className={`relative rounded-2xl border-2 p-5 cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? `${mode.accentColor} ring-2 ring-blue-400 shadow-md transform scale-[1.01]`
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0">
                      {mode.icon}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        {mode.badge}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 leading-snug">
                        {mode.title}
                      </h3>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center space-x-1 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đã chọn</span>
                    </div>
                  )}
                </div>

                <div className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-mono font-semibold mb-2.5">
                  ⏱ {mode.duration}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {mode.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Hình thức thi:</span>
                <strong className="text-slate-800">{mode.subtitle}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
