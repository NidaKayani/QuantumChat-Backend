/** Quantum Chat — Sky Blue Glass Theme */
import type { WebsiteBranding } from '@quantum-chat/shared';

export const theme = {
  colors: {
    navy950: '#BFDBFE',
    navy900: 'rgba(224, 242, 254, 0.85)',
    navy800: 'rgba(191, 219, 254, 0.75)',
    navy700: 'rgba(147, 197, 253, 0.65)',
    navy600: '#93C5FD',
    navy500: '#60A5FA',
    accent: '#2563EB',
    accentLight: '#3B82F6',
    accentDark: '#4F46E5',
    accentGlow: 'rgba(37, 99, 235, 0.25)',
    text: '#0C4A6E',
    textSecondary: '#0369A1',
    textMuted: '#0284C7',
    border: 'rgba(37, 99, 235, 0.18)',
    borderLight: 'rgba(37, 99, 235, 0.12)',
    success: '#059669',
    error: '#DC2626',
    bubbleOwn: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
    bubbleOther: 'linear-gradient(180deg, rgba(224, 242, 254, 0.95) 0%, rgba(191, 219, 254, 0.88) 100%)',
    inputBg: 'rgba(239, 246, 255, 0.72)',
  },
  shadow: {
    widget: '0 25px 50px -12px rgba(37, 99, 235, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.4) inset',
    launcher: '0 8px 32px rgba(37, 99, 235, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.35)',
    bubble: '0 4px 14px rgba(37, 99, 235, 0.12)',
  },
  radius: {
    widget: 20,
    bubble: 18,
    input: 14,
  },
} as const;

export interface ResolvedTheme {
  colors: {
    navy950: string;
    navy900: string;
    navy800: string;
    navy700: string;
    navy600: string;
    navy500: string;
    accent: string;
    accentLight: string;
    accentDark: string;
    accentGlow: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderLight: string;
    success: string;
    error: string;
    bubbleOwn: string;
    bubbleOther: string;
    inputBg: string;
  };
  shadow: {
    widget: string;
    launcher: string;
    bubble: string;
  };
  radius: {
    widget: number;
    bubble: number;
    input: number;
  };
}

export function resolveTheme(branding?: Partial<WebsiteBranding>): ResolvedTheme {
  const accent = branding?.accentColor || theme.colors.accent;
  const primary = branding?.primaryColor || '#4F46E5';

  return {
    ...theme,
    colors: {
      ...theme.colors,
      accent,
      accentLight: accent,
      accentDark: primary,
      accentGlow: `${accent}40`,
      bubbleOwn: `linear-gradient(135deg, ${accent} 0%, ${primary} 100%)`,
      bubbleOther: theme.colors.bubbleOther,
    },
    shadow: {
      ...theme.shadow,
      launcher: `0 8px 32px ${accent}45, 0 0 0 1px rgba(255,255,255,0.35)`,
    },
  };
}
