import React, { useState, useEffect } from 'react';
import {
  Plus,
  Upload,
  Download,
  Edit3,
  Trash2,
  Eye,
  FileText,
  Clock,
  Layers,
  CheckCircle,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';
import type { ExamData } from '../../types/exam';
import { adminTestService } from '../../services/adminTestService';
import { AdminTestEditor } from './AdminTestEditor';

interface AdminDashboardProps {
  onBackToApp: () => void;
  onPreviewTest: (testData: ExamData) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToApp,
  onPreviewTest,
}) => {
  const [tests, setTests] = useState<ExamData[]>(() => adminTestService.getAllTestsSync());
  const [editingTest, setEditingTest] = useState<ExamData | null>(null);

  const refreshTests = async () => {
    const list = await adminTestService.getAllTests();
    setTests(list);
  };

  useEffect(() => {
    refreshTests();
  }, []);

  const handleCreateNew = () => {
    const empty = adminTestService.createEmptyTest();
    setEditingTest(empty);
  };

  const handleDelete = async (code: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa đề thi mã [${code}]?`)) {
      await adminTestService.deleteTest(code);
      refreshTests();
    }
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await adminTestService.importTestFromJson(content);
      if (res.success) {
        alert('✓ Đã import đề thi thành công và lưu vào tài khoản!');
        refreshTests();
      } else {
        alert(`❌ Lỗi import: ${res.error}`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset file input
  };

  // Nếu đang mở trình soạn thảo
  if (editingTest) {
    return (
      <AdminTestEditor
        initialTest={editingTest}
        onBack={() => {
          setEditingTest(null);
          refreshTests();
        }}
        onPreview={onPreviewTest}
      />
    );
  }

  const totalQuestionsAllTests = tests.reduce(
    (sum, t) => sum + (t.questions ? t.questions.length : 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Header trang quản trị */}
      <header className="bg-iig-navy text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBackToApp}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về phòng thi</span>
          </button>
          <div className="border-l border-slate-700 pl-3">
            <h1 className="text-base font-bold tracking-tight">
              BẢNG QUẢN TRỊ NGÂN HÀNG ĐỀ THI TOEIC
            </h1>
            <p className="text-xs text-slate-300">
              Quản lý đề, upload audio/ảnh, phân loại Part 1-7, xuất nhập file JSON
            </p>
          </div>
        </div>

        {/* Nút hành động thêm mới / import */}
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs cursor-pointer transition-all shadow-sm">
            <Upload className="w-4 h-4" />
            <span>Import đề từ file JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJsonFile}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleCreateNew}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đề thi mới</span>
          </button>
        </div>
      </header>

      {/* Thân trang quản trị */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* KPI thống kê */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-iig-accent flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Tổng số đề thi</span>
              <p className="text-2xl font-black text-slate-900 font-mono">{tests.length} đề</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Tổng số câu hỏi</span>
              <p className="text-2xl font-black text-slate-900 font-mono">
                {totalQuestionsAllTests} câu
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Quy chuẩn định dạng</span>
              <p className="text-sm font-bold text-slate-800">CBT IIG Vietnam</p>
            </div>
          </div>
        </div>

        {/* Danh sách đề thi */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Danh mục đề thi trong ngân hàng
            </h2>
            <span className="text-xs text-slate-500">
              Hiển thị {tests.length} đề thi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Tên đề thi</th>
                  <th className="px-5 py-3.5">Mã đề (Code)</th>
                  <th className="px-5 py-3.5">Thời gian</th>
                  <th className="px-5 py-3.5">Số câu hỏi</th>
                  <th className="px-5 py-3.5">Audio đề</th>
                  <th className="px-5 py-3.5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tests.map((t) => (
                  <tr key={t.test.code} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <strong className="text-slate-900 block font-bold text-sm">
                        {t.test.title}
                      </strong>
                      <span className="text-slate-400 text-xs line-clamp-1">
                        {t.test.description || 'Chưa có mô tả'}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-iig-accent">
                      {t.test.code}
                    </td>
                    <td className="px-5 py-4 font-mono">
                      {t.test.duration_minutes} phút
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-slate-100 text-slate-700 font-mono font-bold px-2 py-0.5 rounded">
                        {t.questions.length} câu
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {t.test.full_audio_url ? (
                        <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Đã gắn audio</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center space-x-1">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Chưa có</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingTest(t)}
                          title="Soạn thảo câu hỏi"
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onPreviewTest(t)}
                          title="Xem trước đề thi"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => adminTestService.exportTestAsJson(t)}
                          title="Tải xuống file JSON"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(t.test.code)}
                          title="Xóa đề thi"
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
