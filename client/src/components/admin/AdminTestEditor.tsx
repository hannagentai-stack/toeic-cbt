import React, { useState } from 'react';
import {
  Save,
  ArrowLeft,
  Eye,
  Download,
  Upload,
  Plus,
  Trash2,
  FileText,
  Volume2,
  Image as ImageIcon,
  CheckCircle2,
  FileCode,
  Layers,
} from 'lucide-react';
import type { ExamData, Question, OptionLabel } from '../../types/exam';
import { adminTestService } from '../../services/adminTestService';
import { uploadMediaToSupabase } from '../../lib/supabase';
import { AudioTimestampPicker } from './AudioTimestampPicker';

interface AdminTestEditorProps {
  initialTest: ExamData;
  onBack: () => void;
  onPreview: (testData: ExamData) => void;
}

export const AdminTestEditor: React.FC<AdminTestEditorProps> = ({
  initialTest,
  onBack,
  onPreview,
}) => {
  const [testData, setTestData] = useState<ExamData>(initialTest);
  const [activeTab, setActiveTab] = useState<'METADATA' | 'QUESTIONS' | 'JSON'>('QUESTIONS');
  const [selectedPart, setSelectedPart] = useState<number>(1);
  const [activeQuestionNumber, setActiveQuestionNumber] = useState<number>(
    testData.questions[0]?.question_number || 1
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState(JSON.stringify(initialTest, null, 2));

  // Lấy câu hỏi đang được chọn để chỉnh sửa
  const currentQuestion = testData.questions.find(
    (q) => q.question_number === activeQuestionNumber
  ) || testData.questions[0];

  // Lưu đề thi vào LocalStorage / Database (Supabase)
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await adminTestService.saveTest(testData);
      if (res.success) {
        setSaveMessage('✓ Đã lưu đề thi thành công vào tài khoản và cơ sở dữ liệu!');
      } else {
        setSaveMessage(`⚠️ Đã lưu cục bộ: ${res.error || 'Lỗi đồng bộ'}`);
      }
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage('❌ Lỗi khi lưu đề thi.');
    } finally {
      setIsSaving(false);
    }
  };

  // Cập nhật thông tin chung đề thi
  const handleUpdateMeta = (field: string, value: unknown) => {
    setTestData((prev) => ({
      ...prev,
      test: {
        ...prev.test,
        [field]: value,
      },
    }));
  };

  // Cập nhật một trường của câu hỏi hiện tại
  const handleUpdateQuestion = (field: keyof Question, value: unknown) => {
    if (!currentQuestion) return;
    setTestData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.question_number === currentQuestion.question_number ? { ...q, [field]: value } : q
      ),
    }));
  };

  // Cập nhật phương án trả lời của câu hỏi
  const handleUpdateOption = (optLabel: OptionLabel, text: string) => {
    if (!currentQuestion) return;
    const newOptions = currentQuestion.options.map((opt) =>
      opt.option_label === optLabel ? { ...opt, option_text: text } : opt
    );
    handleUpdateQuestion('options', newOptions);
  };

  // Thêm một câu hỏi mới vào Part đang chọn
  const handleAddQuestion = () => {
    const nextQNum =
      testData.questions.length > 0
        ? Math.max(...testData.questions.map((q) => q.question_number)) + 1
        : 1;

    const newQ: Question = {
      part_number: selectedPart,
      question_number: nextQNum,
      question_type: selectedPart === 1 ? 'PHOTO' : selectedPart === 2 ? 'QUESTION_RESPONSE' : 'INCOMPLETE_SENTENCE',
      question_text: selectedPart <= 2 ? null : 'Nội dung câu hỏi...',
      audio_url: null,
      image_url: null,
      audio_timestamp: null,
      correct_option: 'A',
      options: [
        { option_label: 'A', option_text: selectedPart <= 2 ? '(A)' : 'Lựa chọn A' },
        { option_label: 'B', option_text: selectedPart <= 2 ? '(B)' : 'Lựa chọn B' },
        { option_label: 'C', option_text: selectedPart <= 2 ? '(C)' : 'Lựa chọn C' },
        ...(selectedPart !== 2
          ? [{ option_label: 'D' as OptionLabel, option_text: selectedPart <= 2 ? '(D)' : 'Lựa chọn D' }]
          : []),
      ],
      explanation: 'Giải thích chi tiết...',
      tags: [],
    };

    setTestData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQ],
      test: {
        ...prev.test,
        total_questions: prev.questions.length + 1,
      },
    }));
    setActiveQuestionNumber(nextQNum);
  };

  // Xóa câu hỏi đang chọn
  const handleDeleteQuestion = (qNum: number) => {
    if (confirm(`Bạn có chắc chắn muốn xóa câu #${qNum}?`)) {
      setTestData((prev) => ({
        ...prev,
        questions: prev.questions.filter((q) => q.question_number !== qNum),
        test: {
          ...prev.test,
          total_questions: Math.max(0, prev.questions.length - 1),
        },
      }));
      const remaining = testData.questions.filter((q) => q.question_number !== qNum);
      if (remaining.length > 0) {
        setActiveQuestionNumber(remaining[0].question_number);
      }
    }
  };

  // Upload file lên Supabase Storage (hoặc blob preview)
  const handleUploadFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'audio' | 'image'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let uploadedUrl: string;
      try {
        uploadedUrl = await adminTestService.uploadMediaToStorage(file, testData.test.code);
      } catch {
        const bucket = type === 'audio' ? 'toeic-audio' : 'toeic-images';
        uploadedUrl = await uploadMediaToSupabase(file, bucket);
      }

      if (type === 'audio') {
        handleUpdateQuestion('audio_url', uploadedUrl);
      } else {
        handleUpdateQuestion('image_url', uploadedUrl);
      }
      alert(`Đã tải lên ${type} thành công vào Storage!`);
    } catch (err: unknown) {
      alert(`Lỗi khi tải file: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Nhập đề từ JSON
  const handleImportJson = async () => {
    const result = await adminTestService.importTestFromJson(jsonInput);
    if (result.success && result.data) {
      setTestData(result.data);
      alert('Đã import đề thi thành công từ JSON và lưu vào tài khoản!');
      setActiveTab('QUESTIONS');
    } else {
      alert(`Lỗi import: ${result.error || 'Dữ liệu JSON không hợp lệ'}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* 1. TOP HEADER ADMIN */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span>Trình soạn thảo đề thi:</span>
              <span className="text-iig-accent">{testData.test.title}</span>
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              Mã đề: {testData.test.code} • Tổng: {testData.questions.length} câu
            </span>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center space-x-2.5">
          {saveMessage && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 animate-in fade-in">
              {saveMessage}
            </span>
          )}

          <button
            type="button"
            onClick={() => onPreview(testData)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-600" />
            <span>Preview đề thi</span>
          </button>

          <button
            type="button"
            onClick={() => adminTestService.exportTestAsJson(testData)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold rounded-xl text-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Xuất JSON</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-5 py-2 bg-iig-navy hover:bg-blue-900 active:scale-95 text-white font-bold rounded-xl text-xs shadow transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu đề thi'}</span>
          </button>
        </div>
      </header>

      {/* 2. THANH ĐIỀU HƯỚNG TABS */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center space-x-2 text-xs font-bold text-slate-600">
        <button
          type="button"
          onClick={() => setActiveTab('QUESTIONS')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition-colors ${
            activeTab === 'QUESTIONS' ? 'bg-iig-navy text-white' : 'hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Soạn câu hỏi (Part 1 - 7)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('METADATA')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition-colors ${
            activeTab === 'METADATA' ? 'bg-iig-navy text-white' : 'hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Thông tin chung & Audio đề</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setJsonInput(JSON.stringify(testData, null, 2));
            setActiveTab('JSON');
          }}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition-colors ${
            activeTab === 'JSON' ? 'bg-iig-navy text-white' : 'hover:bg-slate-100'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Nhập / Xuất JSON</span>
        </button>
      </div>

      {/* 3. NỘI DUNG TABS */}
      <div className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
        {/* TAB 1: THÔNG TIN CHUNG */}
        {activeTab === 'METADATA' && (
          <div className="max-w-2xl mx-auto bg-white border border-slate-300 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-3">
              Cấu hình thông tin đề thi TOEIC
            </h2>

            <div className="space-y-4 text-xs md:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiêu đề đề thi:</label>
                <input
                  type="text"
                  value={testData.test.title}
                  onChange={(e) => handleUpdateMeta('title', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã đề (Code - Unique):</label>
                  <input
                    type="text"
                    value={testData.test.code}
                    onChange={(e) => handleUpdateMeta('code', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thời gian thi (phút):</label>
                  <input
                    type="number"
                    value={testData.test.duration_minutes}
                    onChange={(e) => handleUpdateMeta('duration_minutes', parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả tóm tắt đề thi:</label>
                <textarea
                  rows={3}
                  value={testData.test.description || ''}
                  onChange={(e) => handleUpdateMeta('description', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  File âm thanh Listening nguyên bài (Full Audio URL):
                </label>
                <input
                  type="text"
                  value={testData.test.full_audio_url || ''}
                  onChange={(e) => handleUpdateMeta('full_audio_url', e.target.value)}
                  placeholder="https://.../full_listening.mp3"
                  className="w-full px-3 py-2 border rounded-lg font-mono text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SOẠN CÂU HỎI THEO TỪNG PART */}
        {activeTab === 'QUESTIONS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-170px)]">
            {/* CỘT TRÁI (4 cols): DANH SÁCH CÂU HỎI & CHỌN PART */}
            <aside className="lg:col-span-4 bg-white border border-slate-300 rounded-2xl shadow-sm p-4 flex flex-col h-full">
              {/* Lọc Part 1 -> 7 */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-bold no-scrollbar">
                {[1, 2, 3, 4, 5, 6, 7].map((pNum) => (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => setSelectedPart(pNum)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                      selectedPart === pNum
                        ? 'bg-iig-navy text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Part {pNum}
                  </button>
                ))}
              </div>

              {/* Nút thêm câu hỏi mới */}
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Câu hỏi Part {selectedPart}:
                </span>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm câu</span>
                </button>
              </div>

              {/* Lưới danh sách câu hỏi */}
              <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-2 pr-1">
                {testData.questions
                  .filter((q) => q.part_number === selectedPart)
                  .map((q) => {
                    const isCurrent = q.question_number === activeQuestionNumber;
                    return (
                      <button
                        key={q.question_number}
                        type="button"
                        onClick={() => setActiveQuestionNumber(q.question_number)}
                        className={`h-11 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center border transition-all ${
                          isCurrent
                            ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>#{q.question_number}</span>
                        <span className="text-[10px] font-normal leading-none">
                          {q.correct_option}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </aside>

            {/* CỘT PHẢI (8 cols): FORM CHI TIẾT CÂU HỎI */}
            {currentQuestion ? (
              <main className="lg:col-span-8 bg-white border border-slate-300 rounded-2xl shadow-sm p-6 overflow-y-auto h-full space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-8 h-8 rounded-lg bg-iig-navy text-white font-mono font-bold text-sm flex items-center justify-center">
                      {currentQuestion.question_number}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      Chi tiết câu hỏi #{currentQuestion.question_number} (Part {currentQuestion.part_number})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(currentQuestion.question_number)}
                    className="flex items-center space-x-1 text-rose-600 hover:text-rose-800 text-xs font-bold p-1 rounded hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa câu này</span>
                  </button>
                </div>

                {/* 1. MỐC THỜI GIAN AUDIO (TIMESTAMP) CHO LISTENING */}
                {currentQuestion.part_number <= 4 && (
                  <AudioTimestampPicker
                    audioUrl={currentQuestion.audio_url || testData.test.full_audio_url}
                    currentTimestamp={currentQuestion.audio_timestamp}
                    onSelectTimestamp={(sec) => handleUpdateQuestion('audio_timestamp', sec)}
                  />
                )}

                {/* 2. MEDIA UPLOAD (AUDIO & ẢNH) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Upload ảnh */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                    <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                      <ImageIcon className="w-4 h-4 text-iig-accent" />
                      <span>Hình ảnh câu hỏi (Part 1/Passage):</span>
                    </span>
                    <input
                      type="text"
                      value={currentQuestion.image_url || ''}
                      onChange={(e) => handleUpdateQuestion('image_url', e.target.value)}
                      placeholder="Link ảnh (https://...)"
                      className="w-full px-2 py-1.5 border rounded text-xs outline-none"
                    />
                    <label className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 font-semibold cursor-pointer hover:bg-slate-100">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload ảnh máy tính</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadFile(e, 'image')}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Upload Audio riêng */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                    <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                      <Volume2 className="w-4 h-4 text-iig-accent" />
                      <span>Audio riêng câu này (nếu có):</span>
                    </span>
                    <input
                      type="text"
                      value={currentQuestion.audio_url || ''}
                      onChange={(e) => handleUpdateQuestion('audio_url', e.target.value)}
                      placeholder="Link audio MP3 (https://...)"
                      className="w-full px-2 py-1.5 border rounded text-xs outline-none"
                    />
                    <label className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 font-semibold cursor-pointer hover:bg-slate-100">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload audio MP3</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleUploadFile(e, 'audio')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* 3. NỘI DUNG CÂU HỎI */}
                {currentQuestion.part_number >= 3 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nội dung câu hỏi (Question Text):
                    </label>
                    <input
                      type="text"
                      value={currentQuestion.question_text || ''}
                      onChange={(e) => handleUpdateQuestion('question_text', e.target.value)}
                      placeholder="Nhập câu hỏi..."
                      className="w-full px-3 py-2 border rounded-lg text-xs md:text-sm outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* 4. CÁC LỰA CHỌN A, B, C, D & ĐÁP ÁN ĐÚNG */}
                <div className="space-y-2.5">
                  <span className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Phương án trả lời & Chọn đáp án đúng:
                  </span>
                  {currentQuestion.options.map((opt) => {
                    const isCorrect = currentQuestion.correct_option === opt.option_label;
                    return (
                      <div
                        key={opt.option_label}
                        className={`flex items-center space-x-2 p-2 rounded-xl border transition-all ${
                          isCorrect ? 'border-emerald-500 bg-emerald-50/70' : 'border-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleUpdateQuestion('correct_option', opt.option_label)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                            isCorrect ? 'bg-emerald-600 text-white shadow' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {opt.option_label}
                        </button>
                        <input
                          type="text"
                          value={opt.option_text}
                          onChange={(e) => handleUpdateOption(opt.option_label, e.target.value)}
                          placeholder={`Nội dung đáp án (${opt.option_label})...`}
                          className="flex-1 px-3 py-1.5 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        {isCorrect && (
                          <span className="text-emerald-700 text-xs font-bold flex items-center space-x-1 pr-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Đáp án đúng</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 5. TRANSCRIPT & GIẢI THÍCH */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Transcript (Lời thoại audio):
                    </label>
                    <textarea
                      rows={3}
                      value={currentQuestion.transcript || ''}
                      onChange={(e) => handleUpdateQuestion('transcript', e.target.value)}
                      placeholder="Lời thoại chi tiết..."
                      className="w-full p-2 border rounded-lg font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Dịch nghĩa tiếng Việt:
                    </label>
                    <textarea
                      rows={3}
                      value={currentQuestion.vietnamese_translation || ''}
                      onChange={(e) => handleUpdateQuestion('vietnamese_translation', e.target.value)}
                      placeholder="Bản dịch tiếng Việt..."
                      className="w-full p-2 border rounded-lg outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Giải thích ngữ pháp, từ vựng chi tiết:
                    </label>
                    <textarea
                      rows={3}
                      value={currentQuestion.explanation || ''}
                      onChange={(e) => handleUpdateQuestion('explanation', e.target.value)}
                      placeholder="Giải thích vì sao đáp án này đúng, bẫy thường gặp..."
                      className="w-full p-2 border rounded-lg outline-none"
                    />
                  </div>
                </div>
              </main>
            ) : (
              <div className="lg:col-span-8 flex items-center justify-center p-12 text-slate-400">
                Chưa có câu hỏi nào trong Part này. Bấm "Thêm câu" để bắt đầu soạn thảo.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NHẬP / XUẤT JSON */}
        {activeTab === 'JSON' && (
          <div className="max-w-4xl mx-auto bg-white border border-slate-300 rounded-2xl p-6 md:p-8 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-800">
                  Soạn thảo mã nguồn JSON
                </h3>
                <p className="text-xs text-slate-500">
                  Dán dữ liệu JSON từ bộ đề ngoài để nạp toàn bộ câu hỏi vào hệ thống
                </p>
              </div>
              <button
                type="button"
                onClick={handleImportJson}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Nhập đề từ JSON này (Apply Import)
              </button>
            </div>

            <textarea
              rows={20}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full p-4 border border-slate-300 rounded-xl font-mono text-xs bg-slate-50 focus:bg-white outline-none leading-relaxed"
            />
          </div>
        )}
      </div>
    </div>
  );
};
