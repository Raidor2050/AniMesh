export const colors = {
  amoledBlack: '#000000',
  surface: {
    primary: 'rgba(255,255,255,0.04)',
    secondary: 'rgba(255,255,255,0.06)',
    hover: 'rgba(255,255,255,0.08)',
    active: 'rgba(255,255,255,0.12)',
    panel: 'rgba(10,10,14,0.88)',
    overlay: 'rgba(10,10,14,0.72)',
  },
  accent: {
    primary: '#6366F1',
    hover: '#818CF8',
    active: '#4F46E5',
    glow: 'rgba(99,102,241,0.4)',
    subtle: 'rgba(99,102,241,0.12)',
  },
  text: {
    primary: 'rgba(255,255,255,0.92)',
    secondary: 'rgba(255,255,255,0.64)',
    tertiary: 'rgba(255,255,255,0.40)',
    disabled: 'rgba(255,255,255,0.24)',
    inverse: '#000',
  },
  state: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
} as const

export const typography = {
  families: {
    mono: '"JetBrains Mono", monospace',
    sans: '"Inter", -apple-system, sans-serif',
  },
  scale: {
    xs: { size: 11, lineHeight: 16, weight: 400 as const, tracking: '0.02em' },
    sm: { size: 12, lineHeight: 16, weight: 400 as const, tracking: '0.01em' },
    base: { size: 13, lineHeight: 20, weight: 400 as const, tracking: '0' },
    md: { size: 14, lineHeight: 20, weight: 500 as const, tracking: '-0.01em' },
    lg: { size: 16, lineHeight: 24, weight: 500 as const, tracking: '-0.01em' },
    xl: { size: 20, lineHeight: 28, weight: 600 as const, tracking: '-0.02em' },
    xxl: { size: 24, lineHeight: 32, weight: 700 as const, tracking: '-0.02em' },
    display: { size: 32, lineHeight: 40, weight: 700 as const, tracking: '-0.03em' },
  },
} as const

export const spacing = {
  unit: 4,
  scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96] as const,
} as const

export const radii = {
  none: 0, xs: 4, sm: 6, md: 8, lg: 12, xl: 16, full: 9999,
} as const

export const elevation = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.4)',
  md: '0 4px 12px rgba(0,0,0,0.5)',
  lg: '0 8px 24px rgba(0,0,0,0.6)',
  glow: (color: string) => `0 0 20px ${color}, 0 0 40px ${color}`,
} as const

export const animation = {
  spring: {
    panel: { stiffness: 300, damping: 30, mass: 1 },
    micro: { stiffness: 500, damping: 35, mass: 0.8 },
    bouncy: { stiffness: 400, damping: 20, mass: 0.9 },
  },
  tween: {
    fast: { duration: 0.15, ease: 'easeOut' },
    normal: { duration: 0.2, ease: 'easeOut' },
    slow: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
    enter: { duration: 0.3, ease: [0, 0, 0.2, 1] },
    exit: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
  stagger: { list: 40, menu: 30, boot: 80 },
} as const
