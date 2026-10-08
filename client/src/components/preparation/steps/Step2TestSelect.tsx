import React, { useState, useEffect } from 'react';
import { CheckCircle2, Upload, Clock, HelpCircle, Sparkles, User, Globe2 } from 'lucide-react';
import { testService } from '../../../services/testService';
import { attemptService } from '../../../services/attemptService';
import { useExamSessionStore } from '../../../store/useExamSessionStore';
import { useAuth } from '../../../context/AuthContext';
import type { ExamData } from '../../../types/exam';

export const Step2TestSelect: React.FC = () => {
  const { config, setTest } = useExamSessionStore();
  const { user } = useAuth();
  const [tests, setTests] = useState<ExamData[]>(() => testService.getAllTestsSync());
  const [importNotice, setImportNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchTests() {
      const list = await testService.getAllTests();
      if (isMounted) {
        setTests(list);
      }
    }
    fetchTests();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const [filterType, setFilterType] = useState<'all' | 'public' | 'mine'>('all');
  const [inProgressTestId, setInProgressTestId] = useState<string | null>(null);

  useEffect(() => {
    attemptService.getInProgressAttempt().then((res) => {
      if (res && res.testId) {
        setInProgressTestId(res.testId);
      }
    });
  }, []);

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
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Bước 2: Chọn đề thi
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Chọn một đề trong kho ngân hàng đề thi hoặc tải lên file đề thi JSON mới.
          </p>
        </div>

        {/* Nút Import nhanh JSON */}
        <label className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-sm cursor-pointer transition-colors flex-shrink-0 self-start sm:self-auto">
          <Upload className="w-4 h-4 text-blue-600" />
          <span>Tải lên file JSON đề thi</span>
          <input
            type="file"
            accept=".json"
            onChange={handleImportJson}
            className="hidden"
          />
        </label>
      </div>

      {importNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold animate-in fade-in">
          {importNotice}
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

      {/* Danh sách đề thi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTests.map((testItem) => {
          const isSelected = config.testId === testItem.test.code;
          const totalQ = testItem.questions ? testItem.questions.length : testItem.test.total_questions || 0;
          const durationMin = testItem.test.duration_minutes || 120;
          const isMine = (testItem.test as any).owner_id === user?.id;
          const isPublic = Boolean((testItem.test as any).is_public);
          const hasInProgress = inProgressTestId === testItem.test.code;

          return (
            <div
              key={testItem.test.code}
              onClick={() => setTest(testItem.test.code, testItem.test.title)}
              className={`rounded-2xl border-2 p-5 cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-300 shadow-md transform scale-[1.01]'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {testItem.test.code}
                    </span>

                    {/* Huy hiệu sở hữu: Đề của tôi / Đề công khai / Đề hệ thống */}
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

              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600 font-mono">
                <div className="flex items-center space-x-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>{totalQ} câu hỏi</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{durationMin} phút</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3 text-xs text-slate-600">
        <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" />
        <span>
          Mẹo: Bạn có thể chọn đề thi rút gọn (Mini Test) để kiểm tra luồng nhanh trong 15 phút, hoặc chọn đề 200 câu để thi thử thực tế.
        </span>
      </div>
    </div>
  );
};
