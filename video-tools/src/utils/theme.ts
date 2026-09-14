export const COLORS = {
  indigo: "#6366f1",
  indigoDark: "#4f46e5",
  indigoLight: "#818cf8",
  indigoGlow: "rgba(99, 102, 241, 0.4)",
  indigoGlowStrong: "rgba(99, 102, 241, 0.6)",
  
  darkBg: "#0f172a",
  darkCard: "#1e293b",
  darkBorder: "#334155",
  
  lightBg: "#f7f7fb",
  lightCard: "#ffffff",
  lightBorder: "#e2e8f0",
  lightText: "#1e293b",
  lightTextMuted: "#64748b",
  
  amber: "#f59e0b",
  amberLight: "#fbbf24",
  emerald: "#10b981",
  emeraldLight: "#34d399",
  red: "#ef4444",
  redLight: "#f87171",
  
  white: "#ffffff",
  black: "#000000",
  overlay: "rgba(15, 23, 42, 0.6)",
  overlayLight: "rgba(255, 255, 255, 0.9)",
};

export const FONTS = {
  inter: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

export const FONT_WEIGHTS = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  glow: "0 0 30px rgba(99, 102, 241, 0.4)",
  glowStrong: "0 0 60px rgba(99, 102, 241, 0.6)",
  innerGlow: "inset 0 0 20px rgba(99, 102, 241, 0.3)",
};

export const Z_INDEX = {
  base: 0,
  card: 10,
  modal: 100,
  tooltip: 200,
  toast: 300,
};

export const ANIMATION = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  spring: { type: "spring", stiffness: 300, damping: 30 } as const,
  springBouncy: { type: "spring", stiffness: 400, damping: 25 } as const,
  springGentle: { type: "spring", stiffness: 200, damping: 40 } as const,
};

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationFrames: 26 * 30, // 26 seconds
};