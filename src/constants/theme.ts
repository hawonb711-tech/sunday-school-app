import { Platform } from 'react-native';

export const COLORS = {
  // Primary palette (Stripe-inspired indigo)
  primary: '#635BFF',
  primaryLight: '#8B85FF',
  primaryVeryLight: '#EEF0FF',
  primaryDark: '#4B45C6',
  primaryGlow: 'rgba(99, 91, 255, 0.15)',

  // Accent
  accent: '#FFD60A',
  accentSoft: '#FFF8E1',

  // Attendance states
  present: '#0EA5E9',
  presentBg: '#E0F2FE',
  late: '#8B5CF6',
  lateBg: '#EDE9FE',
  absent: '#F43F5E',
  absentBg: '#FFF1F2',
  prenotified: '#F59E0B',
  prenotifiedBg: '#FEF3C7',
  untouched: '#CBD5E1',
  untouchedBg: '#F1F5F9',

  // Memo
  memoRed: '#F43F5E',
  memoBlue: '#0EA5E9',
  memoGreen: '#10B981',

  // Neutrals
  white: '#FFFFFF',
  black: '#0A0A0A',
  background: '#F0F2F5',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textLight: '#94A3B8',
  textMuted: '#CBD5E1',
  border: 'rgba(0,0,0,0.08)',
  borderLight: 'rgba(0,0,0,0.04)',
  separator: '#E2E8F0',

  // Glass
  glass: 'rgba(255,255,255,0.15)',
  glassBorder: 'rgba(255,255,255,0.35)',
  glassLight: 'rgba(255,255,255,0.10)',
  glassDark: 'rgba(255,255,255,0.25)',
  glassOverlay: 'rgba(255,255,255,0.20)',

  // Semantic
  yearRed: '#F43F5E',
  teacherBg: 'rgba(255,244,230,0.5)',
  currentWeekBg: 'rgba(254, 249, 195, 0.6)',

  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  info: '#0EA5E9',
  infoLight: '#F0F9FF',

  // Overlays
  modalBg: 'rgba(15, 23, 42, 0.5)',
  headerBg: 'rgba(255,255,255,0.10)',

  // Decorative blobs (more vivid for glass to show through)
  blob1: 'rgba(99, 91, 255, 0.25)',
  blob2: 'rgba(14, 165, 233, 0.20)',
  blob3: 'rgba(139, 92, 246, 0.18)',
  blob4: 'rgba(244, 63, 94, 0.12)',
};

// BlurView-based glass config (use with GlassCard component)
export const BLUR = {
  card: { intensity: 60, tint: 'light' as const },
  cardStrong: { intensity: 80, tint: 'light' as const },
  header: { intensity: 50, tint: 'light' as const },
  modal: { intensity: 90, tint: 'light' as const },
  dark: { intensity: 60, tint: 'dark' as const },
};

// Fallback CSS glass (for web or non-blur contexts)
const blurCSS = (amount: number) =>
  Platform.OS === 'web'
    ? { backdropFilter: `blur(${amount}px) saturate(180%)`, WebkitBackdropFilter: `blur(${amount}px) saturate(180%)` }
    : {};

export const GLASS = {
  card: {
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 20,
    ...blurCSS(20),
  } as any,
  cardSolid: {
    backgroundColor: COLORS.glassDark,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 20,
    ...blurCSS(24),
  } as any,
  header: {
    backgroundColor: COLORS.headerBg,
    borderBottomWidth: 1,
    borderColor: COLORS.glassBorder,
    ...blurCSS(20),
  } as any,
  modal: {
    backgroundColor: COLORS.glassDark,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...blurCSS(40),
  } as any,
};

export const SIZES = {
  gridCellWidth: 52,
  gridCellHeight: 56,
  nameColumnWidth: 100,
  monthHeaderHeight: 40,
  dateHeaderHeight: 36,
  circleOuter: 28,
  circleInner: 18,
  memoWidth: 7,
  memoHeight: 9,

  yearFont: 18,
  monthFont: 13,
  dateFont: 13,
  nameFont: 13,
  bodyFont: 15,
  smallFont: 13,
  tinyFont: 11,

  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,

  radiusSm: 10,
  radiusMd: 14,
  radiusLg: 20,
  radiusXl: 28,
  radiusFull: 999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#635BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  medium: {
    shadowColor: '#635BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  large: {
    shadowColor: '#635BFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 8,
  },
  glow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
};
