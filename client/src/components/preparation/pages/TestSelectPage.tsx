import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  Upload,
  Headphones,
  BookOpen,
  Award,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Globe2,
  User,
} from 'lucide-react';
import { testService } from '../../../services/testService';
import { attemptService } from '../../../services/attemptService';
import { useExamSessionStore } from '../../../store/useExamSessionStore';
import { useAuth } from '../../../context/AuthContext';
import type { ExamData } from '../../../types/exam';

interface TestSelectPageProps {
  onBack: () => void;
  onNext: () => void;
}

const PART_ITEMS = [
  { part: 1, name: 'Part 1', desc: 'Tranh ảnh (Photo)', count: 6, skill: 'L' },
  { part: 2, name: 'Part 2', desc: 'Hỏi - Đáp (Q&R)', count: 25, skill: 'L' },
  { part: 3, name: 'Part 3', desc: 'Hội thoại (Conversations)', count: 39, skill: 'L' },
  { part: 4, name: 'Part 4', desc: 'Bài nói ngắn (Talks)', count: 30, skill: 'L' },
  { part: 5, name: 'Part 5', desc: 'Điền câu (Incomplete)', count: 30, skill: 'R' },
  { part: 6, name: 'Part 6', desc: 'Điền đoạn văn (Completion)', count: 16, skill: 'R' },
  { part: 7, name: 'Part 7', desc: 'Đọc hiểu (Reading)', count: 54, skill: 'R' },
];

export const TestSelectPage: React.FC<TestSelectPageProps> = ({ onBack, onNext }) => {
  const { config, setTest, setSkill, togglePart } = useExamSessionStore();
  const { user } = useAuth();
  const [tests, setTests] = useState<ExamData[]>(() => testService.getAllTestsSync());
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'public' | 'mine'>('all');
  const [inProgressTestId, setInProgressTestId] = useState<string | null>(null);
  const [allAttempts, setAllAttempts] = useState(() => attemptService.getAllAttemptsSync());

  useEffect(() => {
    let isMounted = true;
    testService.getAllTests().then((list) => {
      if (isMounted) setTests(list);
    });
    attemptService.getInProgressAttempt().then((res) => {
      if (isMounted && res && res.testId) setInProgressTestId(res.testId);
    });
    attemptService.getAllAttemptsAsync().then((atts) => {
      if (isMounted && atts.length > 0) setAllAttempts(atts);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedParts = config.parts || [5];

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await testService.importTestFromJson(content);
      if (res.success && res.data) {
        const updatedList = await testService.getAllTests();
        setTests(updatedList);
        setTest(res.data.test.code, res.data.test.title);
        setImportNotice(`✓ Đã import thành công: "${res.data.test.title}"`);
        setTimeout(() => setImportNotice(null), 4000);
      } else {
        alert(`❌ Lỗi import: ${res.error || 'Dữ liệu JSON không hợp lệ'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredTests = tests.filter((testItem) => {
    const isMine = (testItem.test as any).owner_id === user?.id;
    const isPublic = Boolean((testItem.test as any).is_public);
    if (filterType === 'mine') return isMine;
    if (filterType === 'public') return isPublic || (!isMine && !isPublic);
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bước 2: Chọn đề thi {config.mode === 'skill' ? '& Kỹ năng' : config.mode === 'practice' ? '& Part' : ''}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Chọn đề thi từ Ngân hàng đề ETS
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Chọn bộ đề thi bạn muốn thực hiện hoặc tải lên file JSON đề thi cá nhân.
          </p>
        </div>

        {/* Nút Import nhanh JSON */}
        <label className="flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-sm cursor-pointer transition-colors flex-shrink-0 self-start sm:self-auto">
          <Upload className="w-4 h-4 text-blue-600" />
          <span>Tải file đề thi JSON</span>
          <input
            type="file"
            accept=".json"
            onChange={handleImportJson}
            className="hidden"
          />
        </label>
      </div>

      {importNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold animate-in fade-in">
          {importNotice}
        </div>
      )}

      {/* 1. NẾU LÀ MODE SKILL: CHỌN KỸ NĂNG (LISTENING HOẶC READING) */}
      {config.mode === 'skill' && (
        <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-5 space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-sky-950 block">
            Chọn kỹ năng thi (Chuẩn ETS 100 câu):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSkill('listening')}
              className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                config.skill === 'listening'
                  ? 'border-sky-600 bg-white ring-2 ring-sky-300 shadow-sm'
                  : 'border-slate-200 bg-white/70 hover:bg-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Listening (Part 1 - 4)</h4>
                  <p className="text-xs text-slate-500">45 phút • 100 câu hỏi • Thang 5 - 495</p>
                </div>
              </div>
              {config.skill === 'listening' && <CheckCircle2 className="w-5 h-5 text-sky-600" />}
            </button>

            <button
              type="button"
              onClick={() => setSkill('reading')}
              className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                config.skill === 'reading'
                  ? 'border-indigo-600 bg-white ring-2 ring-indigo-300 shadow-sm'
                  : 'border-slate-200 bg-white/70 hover:bg-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Reading (Part 5 - 7)</h4>
                  <p className="text-xs text-slate-500">75 phút • 100 câu hỏi • Thang 5 - 495</p>
                </div>
              </div>
              {config.skill === 'reading' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
            </button>
          </div>
        </div>
      )}

      {/* 2. NẾU LÀ MODE PRACTICE: CHIP CHỌN NHIỀU PART */}
      {config.mode === 'practice' && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-indigo-950">
              Chọn các Part cần luyện tập (chọn 1 hoặc nhiều):
            </label>
            <span className="text-xs font-bold text-indigo-700 font-mono">
              Đã chọn: {selectedParts.length}/7 Part
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {PART_ITEMS.map((item) => {
              const isChecked = selectedParts.includes(item.part);
              return (
                <button
                  key={item.part}
                  type="button"
                  onClick={() => togglePart(item.part)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[78px] ${
                    isChecked
                      ? 'border-indigo-600 bg-white ring-2 ring-indigo-300 shadow-sm'
                      : 'border-slate-200 bg-white/70 hover:bg-white opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${item.skill === 'L' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {item.skill === 'L' ? 'Nghe' : 'Đọc'}
                    </span>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${isChecked ? 'bg-indigo-600 text-white' : 'border border-slate-300'}`}>
                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                  </div>

                  <span className="font-bold text-xs text-slate-900 mt-1">{item.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{item.count} câu</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bộ lọc Đề công khai / Đề của tôi */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 text-xs">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
            filterType === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Tất cả đề ({tests.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('public')}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
            filterType === 'public'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Globe2 className="w-3.5 h-3.5" />
          <span>Đề công khai</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterType('mine')}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
            filterType === 'mine'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Đề của tôi</span>
        </button>
      </div>

      {/* 3. DANH SÁCH ĐỀ THI DẠNG THẺ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTests.map((testItem) => {
          const isSelected = config.testId === testItem.test.code;
          const totalQ = testItem.questions ? testItem.questions.length : testItem.test.total_questions || 0;
          const durationMin = testItem.test.duration_minutes || 120;
          const isMine = (testItem.test as any).owner_id === user?.id;
          const isPublic = Boolean((testItem.test as any).is_public);
          const hasInProgress = inProgressTestId === testItem.test.code;

          // Tìm lần thi gần nhất cho đề này
          const matchingAttempts = allAttempts.filter((a) => a.testId === testItem.test.code);
          const latest = matchingAttempts[0];

          return (
            <div
              key={testItem.test.code}
              onClick={() => setTest(testItem.test.code, testItem.test.title)}
              className={`rounded-2xl border-2 p-5 cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-300 shadow-md transform scale-[1.01]'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {testItem.test.code}
                    </span>

                    {/* Huy hiệu sở hữu */}
                    {isMine ? (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                        <User className="w-3 h-3" />
                        <span>Đề của tôi</span>
                      </span>
                    ) : isPublic ? (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <Globe2 className="w-3 h-3" />
                        <span>Đề công khai</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Đề hệ thống
                      </span>
                    )}

                    {hasInProgress && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                        Đang làm dở
                      </span>
                    )}

                    {/* Trạng thái đã làm / chưa làm */}
                    {latest ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Đã làm
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        Chưa làm
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <span className="flex items-center space-x-1 bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đã chọn</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug mb-1.5">
                  {testItem.test.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                  {testItem.test.description || 'Bộ đề thi chuẩn format ETS TOEIC phục vụ kiểm tra năng lực.'}
                </p>
              </div>

              {/* Thông số & Điểm lần gần nhất */}
              <div className="pt-3 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 font-mono">
                  <div className="flex items-center space-x-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>{totalQ} câu hỏi</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{durationMin} phút</span>
                  </div>
                </div>

                {/* Điểm lần gần nhất */}
                <div className="text-[11px] bg-slate-50 p-2 rounded-lg flex items-center justify-between border border-slate-200/60">
                  <span className="text-slate-500 font-medium">Điểm lần gần nhất:</span>
                  {latest && latest.scoreResult ? (
                    <span className="font-bold text-slate-800 flex items-center space-x-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        <strong className="text-blue-700">{latest.scoreResult.totalScore}</strong>/990
                        <span className="text-slate-400 font-normal ml-1">
                          (L: {latest.scoreResult.listeningScaledScore}, R: {latest.scoreResult.readingScaledScore})
                        </span>
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Chưa có điểm</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nút điều hướng */}
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
          onClick={onNext}
          className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center space-x-2 shadow-md shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Tiếp tục</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
