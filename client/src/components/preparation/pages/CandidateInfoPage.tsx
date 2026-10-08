import React, { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  CreditCard,
  Mail,
  Dices,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { useExamSessionStore } from '../../../store/useExamSessionStore';
import type { CandidateInfo } from '../../../types/session';
import { useAuth } from '../../../context/AuthContext';

interface CandidateInfoPageProps {
  onBack: () => void;
  onNext: () => void;
}

const LOCAL_STORAGE_CANDIDATE_KEY = 'toeic_saved_candidate';

export const CandidateInfoPage: React.FC<CandidateInfoPageProps> = ({ onBack, onNext }) => {
  const { config, setCandidate } = useExamSessionStore();
  const { profile, user } = useAuth();

  const [formData, setFormData] = useState<CandidateInfo>(() => {
    // 1. Kiểm tra từ profile đang đăng nhập
    if (profile?.full_name) {
      return {
        fullName: profile.full_name,
        dateOfBirth: profile.date_of_birth || '2000-01-15',
        candidateId: profile.candidate_id || 'SBD-882901',
        email: user?.email || 'candidate@toeic.edu.vn',
        targetScore: config.candidate?.targetScore || 750,
      };
    }
    // 2. Kiểm tra từ store
    if (config.candidate && 'fullName' in config.candidate) {
      return config.candidate;
    }
    // 3. Kiểm tra từ localStorage đã lưu lần trước
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CANDIDATE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}

    // 4. Mặc định
    return {
      fullName: 'NGUYỄN VĂN AN',
      dateOfBirth: '2000-01-15',
      candidateId: 'VN-882901-CBT',
      email: 'candidate@toeic.edu.vn',
      targetScore: 750,
    };
  });

  const [errors, setErrors] = useState<{
    fullName?: string;
    dateOfBirth?: string;
    candidateId?: string;
    email?: string;
  }>({});

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Cập nhật store và localStorage khi formData thay đổi
  useEffect(() => {
    setCandidate(formData);
    try {
      localStorage.setItem(LOCAL_STORAGE_CANDIDATE_KEY, JSON.stringify(formData));
    } catch {}
  }, [formData, setCandidate]);

  const validate = (data: CandidateInfo) => {
    const errs: typeof errors = {};

    // Họ tên
    const nameTrim = data.fullName.trim();
    if (!nameTrim) {
      errs.fullName = 'Vui lòng nhập họ và tên thí sinh.';
    } else if (nameTrim.split(/\s+/).length < 2) {
      errs.fullName = 'Họ và tên phải có ít nhất 2 từ (ví dụ: NGUYỄN VĂN AN).';
    }

    // Ngày sinh
    if (!data.dateOfBirth) {
      errs.dateOfBirth = 'Vui lòng chọn ngày sinh của bạn.';
    } else {
      const year = new Date(data.dateOfBirth).getFullYear();
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1920 || year > currentYear - 8) {
        errs.dateOfBirth = 'Ngày sinh không hợp lệ (năm sinh từ 1920 đến nay).';
      }
    }

    // Số báo danh
    const idTrim = data.candidateId.trim();
    if (!idTrim) {
      errs.candidateId = 'Vui lòng nhập hoặc tạo số báo danh.';
    } else if (idTrim.length < 4) {
      errs.candidateId = 'Số báo danh phải có ít nhất 4 ký tự.';
    }

    // Email (tùy chọn, nhưng nếu nhập phải đúng format)
    if (data.email && data.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        errs.email = 'Địa chỉ email không đúng định dạng (ví dụ: candidate@toeic.edu.vn).';
      }
    }

    return errs;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate(formData);
    setErrors(errs);
  };

  const handleChange = (field: keyof CandidateInfo, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    if (touched[field]) {
      const errs = validate(updated);
      setErrors(errs);
    }
  };

  const handleGenerateRandomId = () => {
    const randNum = Math.floor(100000 + Math.random() * 900000);
    const newId = `VN-${randNum}-CBT`;
    handleChange('candidateId', newId);
    setTouched((prev) => ({ ...prev, candidateId: true }));
  };

  const handleSubmit = () => {
    const allTouched = { fullName: true, dateOfBirth: true, candidateId: true, email: true };
    setTouched(allTouched);
    const errs = validate(formData);
    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      onNext();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bước 3: Thông tin định danh thí sinh (Chuẩn CBT)</span>
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          Hồ sơ thí sinh dự thi
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Thông tin được đồng bộ lên Thẻ phòng thi điện tử và Chứng chỉ kết quả TOEIC sau khi kết thúc bài làm.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form điền thông tin */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          {/* Họ và tên */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Họ và tên thí sinh <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value.toUpperCase())}
                onBlur={() => handleBlur('fullName')}
                placeholder="NGUYỄN VĂN AN"
                className={`w-full pl-11 pr-4 py-2.5 rounded-xl border font-semibold text-slate-900 focus:outline-none focus:ring-2 uppercase tracking-wide text-sm transition-all ${
                  errors.fullName
                    ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-500 focus:border-rose-500'
                    : 'border-slate-300 focus:ring-blue-600 focus:border-blue-600'
                }`}
              />
            </div>
            {errors.fullName ? (
              <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.fullName}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-1">
                Tự động in hoa theo quy định phòng thi IIG Việt Nam.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ngày sinh */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Ngày sinh (Date of Birth) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  onBlur={() => handleBlur('dateOfBirth')}
                  className={`w-full pl-11 pr-4 py-2.5 rounded-xl border font-mono text-slate-900 focus:outline-none focus:ring-2 text-sm transition-all ${
                    errors.dateOfBirth
                      ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-500 focus:border-rose-500'
                      : 'border-slate-300 focus:ring-blue-600 focus:border-blue-600'
                  }`}
                />
              </div>
              {errors.dateOfBirth && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errors.dateOfBirth}</span>
                </p>
              )}
            </div>

            {/* Số báo danh (SBD) kèm nút Tạo ngẫu nhiên */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Số báo danh (SBD) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateRandomId}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 hover:underline cursor-pointer"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Tạo ngẫu nhiên</span>
                </button>
              </div>

              <div className="relative">
                <CreditCard className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.candidateId}
                  onChange={(e) => handleChange('candidateId', e.target.value.toUpperCase())}
                  onBlur={() => handleBlur('candidateId')}
                  placeholder="VN-882901-CBT"
                  className={`w-full pl-11 pr-4 py-2.5 rounded-xl border font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 uppercase tracking-wider text-sm transition-all ${
                    errors.candidateId
                      ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-500 focus:border-rose-500'
                      : 'border-slate-300 focus:ring-blue-600 focus:border-blue-600'
                  }`}
                />
              </div>
              {errors.candidateId && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errors.candidateId}</span>
                </p>
              )}
            </div>
          </div>

          {/* Email (Tùy chọn) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Email nhận phân tích (Tùy chọn)
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="candidate@toeic.edu.vn"
                className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-slate-900 focus:outline-none focus:ring-2 text-sm transition-all ${
                  errors.email
                    ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-500 focus:border-rose-500'
                    : 'border-slate-300 focus:ring-blue-600 focus:border-blue-600'
                }`}
              />
            </div>
            {errors.email ? (
              <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.email}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-1">
                Dùng để đối chiếu và theo dõi sự tiến bộ qua các bài kiểm tra.
              </p>
            )}
          </div>
        </div>

        {/* Live Preview Thẻ dự thi IIG CBT */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-[10px] uppercase font-mono tracking-widest px-2.5 py-1 bg-white/10 rounded-full text-blue-200 border border-white/10 flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>OFFICIAL CBT</span>
            </div>

            <div className="flex items-center space-x-2 text-xs font-bold tracking-wider text-blue-300 uppercase mb-4">
              <span>IIG VIETNAM</span>
              <span>•</span>
              <span>CANDIDATE ID CARD</span>
            </div>

            <div className="flex items-center space-x-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-2xl shadow-inner border-2 border-white/20">
                {formData.fullName ? formData.fullName.charAt(0) : 'T'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-blue-200 uppercase tracking-wider font-semibold">Thí sinh</div>
                <div className="font-black text-lg text-white truncate tracking-wide">
                  {formData.fullName || 'CHƯA ĐIỀN TÊN'}
                </div>
                <div className="font-mono text-xs text-blue-300/90 mt-0.5">
                  ID: {formData.candidateId || 'VN-CHƯA_CÓ'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 text-xs font-mono">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Ngày sinh</div>
                <div className="font-semibold text-slate-200 mt-0.5">
                  {formData.dateOfBirth || 'Chưa chọn'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Chế độ thi</div>
                <div className="font-semibold text-slate-200 mt-0.5 uppercase">
                  {config.mode === 'full' ? 'Thi đầy đủ' : 'Kỹ năng'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Đề thi</div>
                <div className="font-semibold text-slate-200 mt-0.5 truncate" title={config.testTitle}>
                  {config.testId}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Ngày thi</div>
                <div className="font-semibold text-emerald-300 mt-0.5">
                  {new Date().toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start space-x-2">
            <span className="font-bold text-blue-700">✓</span>
            <p className="leading-relaxed">
              Thông tin đã điền sẽ được tự động ghi nhớ trên máy của bạn (localStorage) để không phải nhập lại trong các lần thi tiếp theo.
            </p>
          </div>
        </div>
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
          onClick={handleSubmit}
          className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center space-x-2 shadow-md shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Tiếp tục</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
