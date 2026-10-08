import { useEffect, useRef, useState, useCallback } from 'react';
import { useListeningStore } from '../store/useListeningStore';
import { mediaService } from '../services/mediaService';

interface UseListeningTimerOptions {
  audioUrl: string | null;
  silenceSeconds?: number; // Số giây im lặng chờ tô đáp án sau khi dứt audio
  activeQuestionNumbers: number[]; // Các câu đang hoạt động cần khóa sau khi hết giờ
  onFinishedItem: () => void; // Callback khi kết thúc cả audio + thời gian im lặng
}

export function useListeningTimer({
  audioUrl,
  silenceSeconds = 8,
  activeQuestionNumbers,
  onFinishedItem,
}: UseListeningTimerOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<number | null>(null);

  const {
    phase,
    volume,
    isMuted,
    setPhase,
    setSilenceRemaining,
    setAudioLoaded,
    setAudioError,
    lockQuestions,
  } = useListeningStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPreloading, setIsPreloading] = useState(false);

  // Dọn dẹp timer đếm ngược khoảng im lặng
  const clearSilenceInterval = useCallback(() => {
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  /**
   * 1. HÀM PRELOAD & KHỞI TẠO AUDIO
   * Tải trước toàn bộ dữ liệu âm thanh vào bộ nhớ cache trước khi phát
   */
  const preloadAndPlayAudio = useCallback(async () => {
    if (!audioUrl) {
      console.warn('[useListeningTimer] Không có audioUrl hợp lệ.');
      return;
    }

    clearSilenceInterval();
    setAudioError(null);
    setAudioLoaded(false);
    setIsPreloading(true);
    setPhase('PRELOADING');

    // Hủy audio cũ nếu đang chạy
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.load();
    }

    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;

    // Sự kiện khi audio đã nạp đủ dữ liệu để phát mượt mà không bị giật
    const handleCanPlayThrough = async () => {
      setIsPreloading(false);
      setAudioLoaded(true);
      setDuration(audio.duration || 0);

      try {
        setPhase('PLAYING');
        setIsPlaying(true);
        await audio.play();
      } catch (err: unknown) {
        console.error('[useListeningTimer] Lỗi khi tự động phát audio:', err);
        setAudioError('Trình duyệt đã chặn tự động phát âm thanh. Vui lòng bấm "Thử lại".');
      }
    };

    // Sự kiện cập nhật thời gian phát
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    // Sự kiện khi dứt audio -> Bắt đầu khoảng im lặng thi thật
    const handleEnded = () => {
      setIsPlaying(false);
      setPhase('SILENCE_COUNTDOWN');

      let remaining = silenceSeconds;
      setSilenceRemaining(remaining);

      clearSilenceInterval();
      silenceTimerRef.current = window.setInterval(() => {
        remaining -= 1;
        setSilenceRemaining(remaining);

        if (remaining <= 0) {
          clearSilenceInterval();
          // QUY TẮC PHÒNG THI IIG: Khóa vĩnh viễn các câu vừa làm xong!
          if (activeQuestionNumbers.length > 0) {
            lockQuestions(activeQuestionNumbers);
          }
          // Chuyển sang câu hoặc nhóm câu tiếp theo
          onFinishedItem();
        }
      }, 1000);
    };

    // Sự kiện xử lý lỗi mạng hoặc link audio hỏng
    const handleError = () => {
      setIsPreloading(false);
      setIsPlaying(false);
      setAudioError('Không thể tải file âm thanh cho câu hỏi này. Vui lòng kiểm tra kết nối mạng và thử lại.');
    };

    audio.addEventListener('canplaythrough', handleCanPlayThrough, { once: true });
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded, { once: true });
    audio.addEventListener('error', handleError, { once: true });

    const playableUrl = mediaService.getPlayableAudioUrl(audioUrl);
    audio.src = playableUrl;
    audio.load();
  }, [
    audioUrl,
    silenceSeconds,
    volume,
    isMuted,
    activeQuestionNumbers,
    clearSilenceInterval,
    setAudioError,
    setAudioLoaded,
    setPhase,
    setSilenceRemaining,
    lockQuestions,
    onFinishedItem,
  ]);

  // Cập nhật âm lượng khi thí sinh điều chỉnh thanh volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Tự động preload và phát khi component mount hoặc khi đổi câu/nhóm câu
  useEffect(() => {
    if (phase !== 'DIRECTIONS' && audioUrl) {
      preloadAndPlayAudio();
    }

    return () => {
      clearSilenceInterval();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [audioUrl, phase, preloadAndPlayAudio, clearSilenceInterval]);

  // Hàm retry cho nút Thử lại khi có lỗi
  const retryAudio = useCallback(() => {
    preloadAndPlayAudio();
  }, [preloadAndPlayAudio]);

  return {
    isPlaying,
    isPreloading,
    currentTime,
    duration,
    retryAudio,
  };
}
