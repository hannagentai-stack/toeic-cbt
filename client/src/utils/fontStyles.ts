import type { FontSizeScale } from '../store/useReadingStore';

export function getReadingFontClass(scale: FontSizeScale): string {
  switch (scale) {
    case 'HUGE':
      return 'text-[20px] md:text-[22px] leading-[1.7]';
    case 'LARGE':
      return 'text-[18px] md:text-[20px] leading-[1.65]';
    case 'NORMAL':
    default:
      return 'text-[16px] md:text-[18px] leading-[1.6]';
  }
}
