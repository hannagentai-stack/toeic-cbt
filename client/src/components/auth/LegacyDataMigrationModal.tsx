import React, { useState, useEffect } from 'react';
import { Database, ArrowRight, CheckCircle2, History, BookOpen, User, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { migrationService, type LegacyDataSummary } from '../../services/migrationService';

export const LegacyDataMigrationModal: React.FC<{ onMigrationComplete?: () => void }> = ({
  onMigrationComplete,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [summary, setSummary] = useState<LegacyDataSummary | null>(null);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && migrationService.hasLegacyData()) {
      const dataSummary = migrationService.getLegacyDataSummary();
      if (dataSummary.attemptsCount > 0 || dataSummary.customTestsCount > 0) {
        setSummary(dataSummary);
        setIsOpen(true);
      }
    }
  }, [isAuthenticated]);

  if (!isOpen || !summary || !user) {
    return null;
  }

  const handleMigrate = async () => {
    setIsMigrating(true);
    setResultMessage(null);

    const res = await migrationService.migrateLegacyDataToSupabase(user.id);
    setIsMigrating(false);

    if (res.success) {
      setResultMessage(
        `✓ Đã chuyển thành công ${res.migratedAttempts} bài thi và ${res.migratedTests} đề thi vào tài khoản!`
      );
      setTimeout(() => {
        setIsOpen(false);
        if (onMigrationComplete) onMigrationComplete();
      }, 2000);
    } else {
      setResultMessage(`❌ Lỗi chuyển dữ liệu: ${res.error || 'Vui lòng thử lại sau.'}`);
    }
  };

  const handleDismiss = () => {
    migrationService.dismissMigration();
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl ring-1 ring-white/10 relative">
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isMigrating}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/25 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10">
            <Database className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Chuyển dữ liệu cũ vào tài khoản</h3>
            <p className="text-xs text-slate-400">Đồng bộ lịch sử thi và đề thi từ trình duyệt</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
          Hệ thống phát hiện trên thiết bị này có dữ liệu được tạo trước khi đăng nhập.
          Bạn có muốn chuyển toàn bộ dữ liệu này vào tài khoản đám mây của mình không?
        </p>

        {/* Thống kê dữ liệu cũ */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center space-x-3">
            <History className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Lịch sử bài thi</span>
              <span className="text-sm font-bold text-white">{summary.attemptsCount} lần thi</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center space-x-3">
            <BookOpen className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Đề tự nhập</span>
              <span className="text-sm font-bold text-white">{summary.customTestsCount} bộ đề</span>
            </div>
          </div>

          {summary.hasCandidate && (
            <div className="col-span-2 p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center space-x-3">
              <User className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Hồ sơ thí sinh đã lưu</span>
                <span className="text-sm font-bold text-slate-200">{summary.candidateName}</span>
              </div>
            </div>
          )}
        </div>

        {resultMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 mb-5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{resultMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isMigrating}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Bỏ qua
          </button>

          <button
            type="button"
            onClick={handleMigrate}
            disabled={isMigrating}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isMigrating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang chuyển dữ liệu...</span>
              </>
            ) : (
              <>
                <span>Chuyển vào tài khoản</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
