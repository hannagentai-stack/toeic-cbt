import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Flag, Highlighter, Trash2, Mail, FileText, CheckCircle2, Layers } from 'lucide-react';
import type { Passage, Question, OptionLabel } from '../../../types/exam';
import { useReadingStore } from '../../../store/useReadingStore';
import { getReadingFontClass } from '../../../utils/fontStyles';

interface Part7ViewProps {
  passage: Passage;
  questions: Question[];
}

export const Part7View: React.FC<Part7ViewProps> = ({ passage, questions }) => {
  const {
    answers,
    flaggedQuestions,
    currentQuestionNumber,
    fontSizeScale,
    highlights,
    selectAnswer,
    toggleFlag,
    jumpToQuestion,
    addHighlight,
    clearPassageHighlights,
  } = useReadingStore();

  const [activeTab, setActiveTab] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const passageContainerRef = useRef<HTMLDivElement | null>(null);

  // Phân tích văn bản thành các tabs nếu là dạng bài đọc kép/ba (Double / Triple Passages)
  const documents = useMemo(() => {
    const rawContent = passage.content || '';
    const breakRegex = /(?:---DOCUMENT_BREAK---|(?:\r?\n){2,}\s*---\s*(?:\r?\n){2,})/i;
    if (breakRegex.test(rawContent)) {
      const parts = rawContent.split(breakRegex);
      return parts.map((part, idx) => ({
        id: `doc_${idx}`,
        title: `Văn bản ${idx + 1}`,
        content: part.trim(),
        type: idx === 0 ? 'email' : 'notice',
      }));
    }
    return [
      {
        id: 'doc_main',
        title: passage.title || 'Văn bản đọc',
        content: rawContent,
        type: 'email',
      },
    ];
  }, [passage]);

  // Tự động cuộn đến câu hỏi hiện tại trong cột phải khi thí sinh chọn trên bảng điều hướng
  useEffect(() => {
    if (currentQuestionNumber) {
      const el = document.getElementById(`p7-q-${currentQuestionNumber}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentQuestionNumber]);

  // Bắt sự kiện bôi đen văn bản để hiển thị tooltip Highlight
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setTooltipPos(null);
      setSelectedText('');
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 2) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = passageContainerRef.current?.getBoundingClientRect();

      if (containerRect) {
        setTooltipPos({
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top - 38,
        });
        setSelectedText(text);
      }
    }
  };

  const handleApplyHighlight = () => {
    if (selectedText) {
      addHighlight(passage.id_ref, selectedText);
      setTooltipPos(null);
      setSelectedText('');
      window.getSelection()?.removeAllRanges();
    }
  };

  const currentHighlights = highlights[passage.id_ref] || [];

  /**
   * Render văn bản với các đoạn đã được tô sáng (highlighted)
   */
  const renderHighlightedContent = (content: string) => {
    if (currentHighlights.length === 0) {
      return content;
    }

    // Tạo regex kết hợp toàn bộ cụm từ đã highlight
    // Escape ký tự đặc biệt trong regex
    const escapedTerms = currentHighlights
      .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .filter(Boolean);

    if (escapedTerms.length === 0) return content;

    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
    const segments = content.split(regex);

    return segments.map((seg, idx) => {
      const isHighlighted = currentHighlights.some(
        (h) => h.toLowerCase() === seg.toLowerCase()
      );
      if (isHighlighted) {
        return (
          <mark
            key={idx}
            className="bg-yellow-200 text-slate-900 px-1 py-0.5 rounded font-semibold transition-all shadow-sm"
          >
            {seg}
          </mark>
        );
      }
      return <span key={idx}>{seg}</span>;
    });
  };

  const currentDoc = documents[activeTab] || documents[0];

  return (
    <div className="h-full p-2.5 md:p-3.5 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 md:gap-4 h-full overflow-hidden">
        {/* CỘT TRÁI: KHUNG ĐỌC VĂN BẢN (Passage) - Cuộn độc lập */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-300 shadow-sm flex flex-col h-full overflow-hidden relative">
          {/* Header & Tabs văn bản đọc */}
          <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2 flex items-center justify-between flex-wrap gap-2">
            {documents.length > 1 ? (
              <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                {documents.map((doc, idx) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === idx
                        ? 'bg-iig-navy text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {idx === 0 ? <Mail className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                    <span>{doc.title}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setActiveTab(-1)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === -1
                      ? 'bg-iig-navy text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Tất cả ({documents.length})</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-iig-accent" />
                <h3 className="font-bold text-sm text-slate-800">
                  {passage.title || 'Part 7: Reading Comprehension'}
                </h3>
              </div>
            )}

            {/* Công cụ Highlight */}
            <div className="flex items-center space-x-2 text-xs">
              {currentHighlights.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearPassageHighlights(passage.id_ref)}
                  title="Xóa toàn bộ highlight của bài đọc này"
                  className="flex items-center space-x-1 text-slate-500 hover:text-rose-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa highlight ({currentHighlights.length})</span>
                </button>
              )}
              <span className="text-slate-400 text-[11px] hidden sm:inline">
                * Bôi đen từ/câu để tô sáng
              </span>
            </div>
          </div>

          {/* Nội dung bài đọc có hỗ trợ chọn text & highlight */}
          <div
            ref={passageContainerRef}
            onMouseUp={handleMouseUp}
            className={`flex-1 overflow-y-auto p-4 md:p-6 text-slate-800 font-serif whitespace-pre-line relative select-text ${getReadingFontClass(fontSizeScale)}`}
          >
            {/* Tooltip nổi khi bôi đen text */}
            {tooltipPos && (
              <div
                style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
                className="absolute z-20 -translate-x-1/2 transform animate-in fade-in zoom-in-95"
              >
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Tránh làm mất selection
                    handleApplyHighlight();
                  }}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 text-yellow-300 hover:text-yellow-200 text-xs font-bold rounded-lg shadow-xl border border-slate-700 transition-all hover:scale-105"
                >
                  <Highlighter className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Tô sáng (Highlight)</span>
                </button>
              </div>
            )}

            {activeTab === -1 ? (
              <div className="space-y-6">
                {documents.map((doc, idx) => (
                  <div key={doc.id} className="border-b border-slate-200 pb-6 last:border-b-0 last:pb-0">
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 font-sans text-xs font-bold mb-3 uppercase tracking-wider">
                      <span>Văn bản {idx + 1}</span>
                    </div>
                    <div>{renderHighlightedContent(doc.content)}</div>
                  </div>
                ))}
              </div>
            ) : currentDoc.content ? (
              renderHighlightedContent(currentDoc.content)
            ) : (
              <p className="text-slate-400">Đang tải nội dung bài đọc...</p>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: CÁC CÂU HỎI CON (Cuộn độc lập) */}
        <div className="lg:col-span-5 flex flex-col h-full overflow-y-auto space-y-3.5 pr-1 pb-16">
          {questions.map((q) => {
            const isSelected = answers[q.question_number];
            const isFlagged = flaggedQuestions.includes(q.question_number);
            const isCurrent = currentQuestionNumber === q.question_number;

            return (
              <div
                key={q.question_number}
                id={`p7-q-${q.question_number}`}
                onClick={() => jumpToQuestion(q.question_number)}
                className={`bg-white rounded-xl border p-5 transition-all scroll-mt-4 ${
                  isCurrent
                    ? 'border-iig-accent ring-2 ring-blue-100 shadow-md'
                    : 'border-slate-300 shadow-sm hover:border-slate-400'
                }`}
              >
                {/* Header câu hỏi */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className={`font-bold text-slate-900 leading-snug ${getReadingFontClass(fontSizeScale)}`}>
                    <span className="text-iig-accent mr-2 font-mono">
                      {q.question_number}.
                    </span>
                    {q.question_text}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFlag(q.question_number);
                    }}
                    title="Đánh dấu câu này"
                    className={`p-1.5 rounded-lg border transition-colors flex-shrink-0 ${
                      isFlagged
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-amber-500'
                    }`}
                  >
                    <Flag className="w-4 h-4 fill-current" />
                  </button>
                </div>

                {/* 4 Lựa chọn A, B, C, D */}
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const isOptChosen = isSelected === opt.option_label;
                    return (
                      <button
                        key={opt.option_label}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAnswer(q.question_number, opt.option_label as OptionLabel);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all text-xs md:text-sm cursor-pointer ${
                          isOptChosen
                            ? 'border-blue-600 bg-blue-50/90 font-semibold text-blue-950 shadow-sm ring-2 ring-blue-200'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mr-3 flex-shrink-0 ${
                              isOptChosen
                                ? 'bg-blue-600 text-white shadow ring-2 ring-blue-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {opt.option_label}
                          </div>
                          <span className={`font-medium leading-relaxed ${getReadingFontClass(fontSizeScale)}`}>{opt.option_text}</span>
                        </div>

                        {isOptChosen && (
                          <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0 ml-1.5 animate-in fade-in">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Đã chọn</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
