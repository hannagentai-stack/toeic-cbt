import React from 'react';
import { User, CreditCard, Mail, Target, Award, ShieldCheck, Sparkles, Calendar } from 'lucide-react';
import { useExamSessionStore } from '../../../store/useExamSessionStore';

const TARGET_PRESETS = [
  { score: 450, label: '450+', desc: 'Tốt nghiệp ĐH cơ bản' },
  { score: 650, label: '650+', desc: 'Chuẩn đầu ra SV & đi làm' },
  { score: 785, label: '785+', desc: 'Doanh nghiệp đa quốc gia' },
  { score: 850, label: '850+', desc: 'Cạnh tranh học bổng / Quản lý' },
  { score: 950, label: '950+', desc: 'Thành thạo gần như bản ngữ' },
];

export const Step4CandidateInfo: React.FC = () => {
  const { config, setCandidate } = useExamSessionStore();
  const info = config.candidate || {
    fullName: 'NGUYỄN VĂN AN',
    dateOfBirth: '2000-01-15',
    candidateId: 'VN-882901-CBT',
    email: 'candidate@toeic.edu.vn',
    targetScore: 750,
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep uppercase for TOEIC format
    setCandidate({ fullName: e.target.value.toUpperCase() });
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCandidate({ dateOfBirth: e.target.value });
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCandidate({ candidateId: e.target.value.toUpperCase() });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCandidate({ email: e.target.value });
  };

  const handleTargetChange = (score: number) => {
    setCandidate({ targetScore: score });
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          Bước 4: Thông tin thí sinh
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Thông tin này sẽ hiển thị trên Thẻ phòng thi (CBT Candidate Card) và Bảng điểm TOEIC điện tử của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form điền thông tin */}
        <div className="lg:col-span-7 space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          {/* Họ tên */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Họ và tên thí sinh <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={info.fullName}
                onChange={handleNameChange}
                placeholder="NGUYỄN VĂN AN"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 uppercase tracking-wide text-sm"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Ghi bằng Tiếng Việt không dấu hoặc có dấu (tự động in hoa theo chuẩn CBT).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ngày sinh */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Ngày sinh (DOB) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={info.dateOfBirth || ''}
                  onChange={handleDobChange}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm"
                />
              </div>
            </div>

            {/* SBD / CCCD */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Số báo danh (SBD) / Mã định danh <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <CreditCard className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={info.candidateId}
                  onChange={handleIdChange}
                  placeholder="VN-882901-CBT"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 uppercase tracking-wider text-sm"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Email nhận phân tích kết quả
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={info.email || ''}
                onChange={handleEmailChange}
                placeholder="candidate@toeic.edu.vn"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Dùng để lưu đối chiếu tiến độ cá nhân qua các lần thi.
            </p>
          </div>

          {/* Mục tiêu điểm số */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Target className="w-4 h-4 text-blue-600" />
                <span>Mục tiêu điểm số (Target Score)</span>
              </span>
              <span className="text-blue-600 font-extrabold text-sm">{info.targetScore || 750} / 990</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TARGET_PRESETS.map((p) => {
                const isSelected = info.targetScore === p.score;
                return (
                  <button
                    key={p.score}
                    type="button"
                    onClick={() => handleTargetChange(p.score)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 shadow-sm ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-black text-sm ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                        {p.label}
                      </span>
                      {isSelected && <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Preview Thẻ dự thi (IIG Candidate Badge Preview) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
            {/* Watermark badge */}
            <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-4 right-4 text-[10px] uppercase font-mono tracking-widest px-2.5 py-1 bg-white/10 rounded-full text-blue-200 border border-white/10 flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>VERIFIED CBT</span>
            </div>

            <div className="flex items-center space-x-2 text-xs font-bold tracking-wider text-blue-300 uppercase mb-4">
              <span>IIG VIETNAM</span>
              <span>•</span>
              <span>TOEIC® OFFICIAL SIMULATION</span>
            </div>

            <div className="flex items-center space-x-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-2xl shadow-inner border-2 border-white/20">
                {info.fullName ? info.fullName.charAt(0) : 'T'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-blue-200 uppercase tracking-wider font-semibold">Thí sinh</div>
                <div className="font-black text-lg text-white truncate tracking-wide">
                  {info.fullName || 'CHƯA ĐẶT TÊN'}
                </div>
                <div className="font-mono text-xs text-blue-300/90 mt-0.5">
                  ID: {info.candidateId || 'VN-DEMO'} {info.dateOfBirth && `• DOB: ${info.dateOfBirth}`}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 text-xs">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Đề thi chọn</div>
                <div className="font-semibold text-slate-200 truncate mt-0.5" title={config.testTitle}>
                  {config.testId}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Chế độ thi</div>
                <div className="font-semibold text-slate-200 capitalize mt-0.5">
                  {config.mode === 'full' && 'Thi đầy đủ (120p)'}
                  {config.mode === 'skill' && `Kỹ năng (${config.skill})`}
                  {config.mode === 'practice' && `Part ${(config.parts || [5]).join(',')}`}
                  {config.mode === 'review-wrong' && 'Ôn lại câu sai'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Mục tiêu</div>
                <div className="font-bold text-amber-300 mt-0.5 flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>{info.targetScore || 750} / 990</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Thời gian làm</div>
                <div className="font-semibold text-emerald-300 mt-0.5">
                  {new Date().toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start space-x-2.5 text-xs text-amber-900">
            <span className="text-amber-600 font-bold text-base leading-none">ℹ</span>
            <p className="leading-relaxed">
              Thông tin họ tên, ngày sinh và SBD được lưu tự động vào phiên thi (sessionStorage) và hiển thị trên bảng phân tích điểm.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
