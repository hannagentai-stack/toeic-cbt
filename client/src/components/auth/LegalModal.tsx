import React from 'react';
import { X, ShieldCheck, FileText, AlertCircle } from 'lucide-react';

export type LegalDocType = 'terms' | 'privacy' | 'disclaimer';

interface LegalModalProps {
  isOpen: boolean;
  type: LegalDocType;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, type, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              {type === 'privacy' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : type === 'terms' ? (
                <FileText className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {type === 'privacy' && 'Chính sách Quyền riêng tư & Bảo mật dữ liệu'}
                {type === 'terms' && 'Điều khoản Sử dụng Hệ thống'}
                {type === 'disclaimer' && 'Tuyên bố Miễn trừ Trách nhiệm & Bản quyền'}
              </h3>
              <p className="text-xs text-slate-400">Hệ thống Thi thử TOEIC CBT Simulation</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto py-5 space-y-4 text-xs text-slate-300 leading-relaxed pr-2">
          {type === 'disclaimer' && (
            <>
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1">
                <p className="font-bold text-amber-200">Lưu ý quan trọng về bản quyền và liên kết tổ chức:</p>
                <p>
                  TOEIC® là nhãn hiệu đã được đăng ký và thuộc quyền sở hữu của Viện Khảo thí Giáo dục Hoa Kỳ (Educational Testing Service - ETS).
                </p>
              </div>
              <p>
                1. <strong>Mục đích phi thương mại:</strong> Nền tảng TOEIC Mock Test này được phát triển độc lập nhằm mục đích học thuật, hỗ trợ học viên làm quen với thao tác giao diện máy tính (CBT) trước kỳ thi chính thức.
              </p>
              <p>
                2. <strong>Không liên kết tổ chức:</strong> Nền tảng KHÔNG liên kết, KHÔNG được ủy quyền, tài trợ hay chứng thực bởi ETS hoặc IIG Việt Nam. Mọi tên gọi, biểu tượng và định dạng chỉ nhằm mục đích mô phỏng giao diện học tập.
              </p>
              <p>
                3. <strong>Tính ước lượng của điểm số:</strong> Điểm số sau bài thi (thang điểm 10 - 990) được tính dựa trên ma trận thuật toán ước lượng chuẩn ETS và KHÔNG có giá trị thay thế phiếu điểm hoặc chứng chỉ chính thức của ETS/IIG.
              </p>
            </>
          )}

          {type === 'privacy' && (
            <>
              <p>
                Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn khi sử dụng hệ thống thi thử:
              </p>
              <p>
                1. <strong>Thông tin thu thập:</strong> Khi đăng ký tài khoản, chúng tôi thu thập địa chỉ email, họ tên, ngày sinh và số báo danh mô phỏng để phục vụ hiển thị trên thẻ dự thi và cá nhân hóa lịch sử làm bài.
              </p>
              <p>
                2. <strong>Bảo mật cơ sở dữ liệu:</strong> Toàn bộ dữ liệu của bạn được mã hóa và bảo vệ bằng chính sách phân quyền cấp hàng (Row Level Security - RLS) trên nền tảng Supabase Postgres. Tài khoản khác tuyệt đối không thể truy cập bài thi hoặc thông tin của bạn.
              </p>
              <p>
                3. <strong>Không chia sẻ cho bên thứ ba:</strong> Chúng tôi cam kết không chia sẻ, bán hay chuyển giao thông tin cá nhân hoặc kết quả luyện thi của bạn cho bất kỳ đơn vị quảng cáo nào.
              </p>
              <p>
                4. <strong>Quyền kiểm soát dữ liệu:</strong> Bạn có toàn quyền cập nhật thông tin hồ sơ của mình tại trang <em>Hồ sơ thí sinh</em> hoặc yêu cầu xóa lịch sử bài làm bất cứ lúc nào.
              </p>
            </>
          )}

          {type === 'terms' && (
            <>
              <p>
                Bằng việc truy cập hoặc sử dụng hệ thống thi thử TOEIC CBT, bạn đồng ý với các điều khoản sau:
              </p>
              <p>
                1. <strong>Hành vi sử dụng:</strong> Người dùng sử dụng trang web cho mục đích ôn tập và nâng cao năng lực cá nhân. Nghiêm cấm các hành vi phá hoại hệ thống, tấn công DDoS, hoặc lạm dụng tài nguyên bộ nhớ.
              </p>
              <p>
                2. <strong>Khuyến nghị thiết bị:</strong> Để đảm bảo trải nghiệm thi chuẩn xác nhất, người dùng nên thực hiện bài thi trên máy tính để bàn (PC) hoặc máy tính xách tay (Laptop) có độ phân giải màn hình từ 1366x768 trở lên và kết nối tai nghe ổn định.
              </p>
              <p>
                3. <strong>Quy chế phòng thi mô phỏng:</strong> Trong chế độ thi thử đầy đủ (Full Test), hệ thống áp dụng các quy chế nghiêm ngặt tương tự thi thật: khóa tua âm thanh, phát tự động 1 lần, khóa câu hỏi nghe sau khi chuyển đoạn.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            Đã hiểu và đóng
          </button>
        </div>
      </div>
    </div>
  );
};
