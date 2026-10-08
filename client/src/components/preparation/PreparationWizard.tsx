import React, { useState, useEffect } from 'react';
import {
  Layers,
  FileCheck,
  Sliders,
  UserCheck,
  Headphones,
  CheckCircle,
  Home,
  Check,
} from 'lucide-react';
import { useExamSessionStore } from '../../store/useExamSessionStore';
import type { TestSessionConfig } from '../../types/session';

import {
  ModeSelectPage,
  TestSelectPage,
  OptionsPage,
  CandidateInfoPage,
  AudioCheckPage,
  InstructionsPage,
} from './pages';

export type WizardStepId = 'mode' | 'test' | 'options' | 'candidate' | 'audio' | 'instructions';

export interface StepMeta {
  id: WizardStepId;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}

export function getApplicableSteps(config: TestSessionConfig): StepMeta[] {
  const steps: StepMeta[] = [
    { id: 'mode', label: 'Chọn chế độ', shortLabel: 'Chế độ', icon: Layers },
    { id: 'test', label: 'Chọn đề thi', shortLabel: 'Đề thi', icon: FileCheck },
  ];

  if (config.mode === 'practice') {
    steps.push({ id: 'options', label: 'Tùy chọn', shortLabel: 'Tùy chọn', icon: Sliders });
  }

  if (config.mode === 'full' || config.mode === 'skill') {
    steps.push({ id: 'candidate', label: 'Thí sinh', shortLabel: 'Thí sinh', icon: UserCheck });
  }

  const hasListening =
    config.mode === 'full' ||
    (config.mode === 'skill' && config.skill === 'listening') ||
    (config.mode === 'practice' && (config.parts || []).some((p) => p <= 4));

  if (hasListening) {
    steps.push({ id: 'audio', label: 'Âm thanh', shortLabel: 'Âm thanh', icon: Headphones });
  }

  steps.push({ id: 'instructions', label: 'Hướng dẫn', shortLabel: 'Hướng dẫn', icon: CheckCircle });

  return steps;
}

export function validateSessionReady(config: TestSessionConfig): {
  isReady: boolean;
  missingStep?: WizardStepId;
  reason?: string;
} {
  const steps = getApplicableSteps(config);

  // Check 1: Đề thi
  if (!config.testId) {
    return { isReady: false, missingStep: 'test', reason: 'Vui lòng chọn đề thi.' };
  }

  // Check 2: Thí sinh nếu là full hoặc skill
  if (steps.some((s) => s.id === 'candidate')) {
    if (!config.candidate?.fullName?.trim() || !config.candidate?.candidateId?.trim()) {
      return { isReady: false, missingStep: 'candidate', reason: 'Vui lòng hoàn tất thông tin thí sinh.' };
    }
  }

  // Check 3: Audio nếu có listening
  if (steps.some((s) => s.id === 'audio')) {
    if (!config.isSoundVerified) {
      return { isReady: false, missingStep: 'audio', reason: 'Vui lòng kiểm tra và xác nhận âm thanh tai nghe.' };
    }
  }

  // Check 4: Nội quy
  if (!config.isTermsAccepted) {
    return { isReady: false, missingStep: 'instructions', reason: 'Vui lòng xác nhận quy chế phòng thi.' };
  }

  return { isReady: true };
}

interface PreparationWizardProps {
  initialStepId?: WizardStepId;
  onBackToHome: () => void;
  onStartExam: () => void;
}

export const PreparationWizard: React.FC<PreparationWizardProps> = ({
  initialStepId = 'mode',
  onBackToHome,
  onStartExam,
}) => {
  const { config } = useExamSessionStore();
  const applicableSteps = getApplicableSteps(config);

  const [activeStepId, setActiveStepId] = useState<WizardStepId>(() => {
    try {
      const saved = sessionStorage.getItem('toeic_wizard_active_step') as WizardStepId;
      if (saved && applicableSteps.some((s) => s.id === saved)) {
        return saved;
      }
    } catch {}

    // Đảm bảo initialStepId có trong applicableSteps
    const exists = applicableSteps.some((s) => s.id === initialStepId);
    return exists ? initialStepId : applicableSteps[0]?.id || 'mode';
  });

  // Lưu activeStepId vào sessionStorage để không mất khi F5 reload
  useEffect(() => {
    try {
      sessionStorage.setItem('toeic_wizard_active_step', activeStepId);
    } catch {}
  }, [activeStepId]);

  // Đồng bộ khi initialStepId thay đổi từ bên ngoài (ví dụ route guard hoặc App đổi step)
  useEffect(() => {
    if (initialStepId) {
      const exists = applicableSteps.some((s) => s.id === initialStepId);
      if (exists) {
        setActiveStepId(initialStepId);
      }
    }
  }, [initialStepId]);

  // Nếu applicableSteps thay đổi (ví dụ đổi mode) mà activeStepId không còn hợp lệ, tự động fallback
  useEffect(() => {
    const exists = applicableSteps.some((s) => s.id === activeStepId);
    if (!exists) {
      setActiveStepId(applicableSteps[0]?.id || 'mode');
    }
  }, [applicableSteps, activeStepId]);

  const currentIdx = applicableSteps.findIndex((s) => s.id === activeStepId);

  const goToNext = () => {
    if (currentIdx < applicableSteps.length - 1) {
      setActiveStepId(applicableSteps[currentIdx + 1].id);
    }
  };

  const goToPrev = () => {
    if (currentIdx > 0) {
      setActiveStepId(applicableSteps[currentIdx - 1].id);
    } else {
      onBackToHome();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black text-lg shadow-sm">
              IIG
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                  TOEIC® CBT SIMULATION
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  Chuẩn bị thi
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Hệ thống chuẩn hóa quy trình thi trắc nghiệm trên máy tính
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onBackToHome}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Về Trang chủ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Stepper Navigation Bar: Động theo mode, cho phép bấm quay lại bước trước */}
      <div className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-6 shadow-xs overflow-x-auto">
        <div className="max-w-5xl mx-auto flex items-center justify-between min-w-[550px] md:min-w-0">
          {applicableSteps.map((step, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = step.id === activeStepId;
            const Icon = step.icon;

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  disabled={idx > currentIdx}
                  onClick={() => {
                    if (idx <= currentIdx) {
                      setActiveStepId(step.id);
                    }
                  }}
                  className={`flex items-center space-x-2.5 text-left transition-all ${
                    idx > currentIdx
                      ? 'cursor-not-allowed opacity-40'
                      : 'cursor-pointer hover:opacity-90'
                  }`}
                  title={isCompleted ? `Quay lại: ${step.label}` : step.label}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-100'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                  </div>

                  <div>
                    <div
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isCurrent
                          ? 'text-blue-600'
                          : isCompleted
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      Bước {idx + 1}
                    </div>
                    <div
                      className={`text-xs font-bold leading-tight ${
                        isCurrent ? 'text-slate-900 font-extrabold' : 'text-slate-600'
                      }`}
                    >
                      {step.shortLabel}
                    </div>
                  </div>
                </button>

                {idx < applicableSteps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 transition-colors ${
                      idx < currentIdx ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
        <div className="flex-1">
          {activeStepId === 'mode' && (
            <ModeSelectPage onNext={goToNext} />
          )}

          {activeStepId === 'test' && (
            <TestSelectPage onBack={goToPrev} onNext={goToNext} />
          )}

          {activeStepId === 'options' && (
            <OptionsPage onBack={goToPrev} onNext={goToNext} />
          )}

          {activeStepId === 'candidate' && (
            <CandidateInfoPage onBack={goToPrev} onNext={goToNext} />
          )}

          {activeStepId === 'audio' && (
            <AudioCheckPage onBack={goToPrev} onNext={goToNext} />
          )}

          {activeStepId === 'instructions' && (
            <InstructionsPage onBack={goToPrev} onStartExam={onStartExam} />
          )}
        </div>
      </main>
    </div>
  );
};
