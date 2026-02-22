// Presety kolorystyczne i wspólne typy stylów

export type StyleConfig = {
  accentColor: string;
  accentColorLight: string;
  bgGradient1: string;
  bgGradient2: string;
  bgGradient3: string;
  ringColor: string;
  tagBg: string;
  tagBorder: string;
};

export const STYLE_PRESETS: Record<string, StyleConfig> = {
  luksusowy: {
    accentColor: "#D4AF37",
    accentColorLight: "#F5E6A3",
    bgGradient1: "#1a1a2e",
    bgGradient2: "#16213e",
    bgGradient3: "#0f3460",
    ringColor: "rgba(212,175,55,",
    tagBg: "rgba(212,175,55,0.12)",
    tagBorder: "rgba(212,175,55,0.35)",
  },
  nowoczesny: {
    accentColor: "#3B82F6",
    accentColorLight: "#93C5FD",
    bgGradient1: "#0f172a",
    bgGradient2: "#1e293b",
    bgGradient3: "#0c4a6e",
    ringColor: "rgba(59,130,246,",
    tagBg: "rgba(59,130,246,0.12)",
    tagBorder: "rgba(59,130,246,0.35)",
  },
  elegancki: {
    accentColor: "#C9A96E",
    accentColorLight: "#E8D5B0",
    bgGradient1: "#1a1520",
    bgGradient2: "#2d1f3d",
    bgGradient3: "#1a0f2e",
    ringColor: "rgba(201,169,110,",
    tagBg: "rgba(201,169,110,0.12)",
    tagBorder: "rgba(201,169,110,0.35)",
  },
  minimalistyczny: {
    accentColor: "#FFFFFF",
    accentColorLight: "#E5E5E5",
    bgGradient1: "#111111",
    bgGradient2: "#1a1a1a",
    bgGradient3: "#222222",
    ringColor: "rgba(255,255,255,",
    tagBg: "rgba(255,255,255,0.08)",
    tagBorder: "rgba(255,255,255,0.25)",
  },
  naturalne: {
    accentColor: "#7CB342",
    accentColorLight: "#AED581",
    bgGradient1: "#1a2e1a",
    bgGradient2: "#1e3d1e",
    bgGradient3: "#0f3d1a",
    ringColor: "rgba(124,179,66,",
    tagBg: "rgba(124,179,66,0.12)",
    tagBorder: "rgba(124,179,66,0.35)",
  },
};

export function getStyle(preset?: string): StyleConfig {
  if (preset && STYLE_PRESETS[preset]) return STYLE_PRESETS[preset];
  return STYLE_PRESETS.luksusowy;
}

export type BrandConfig = {
  headline: string;
  ctaText: string;
  ctaSubtext: string;
  logoSrc?: string;
  stylePreset: string;
};

export const DEFAULT_BRAND: BrandConfig = {
  headline: "NA SPRZEDAZ",
  ctaText: "ZADZWON",
  ctaSubtext: "ZAINTERESOWANY?",
  stylePreset: "luksusowy",
};
