export const DEFAULT_SCORING_THEME = 'dark';
export const DEFAULT_SCORING_ACCENT = '#ffffff';

const THEME_KEY = 'pageants-scoring-theme';
const ACCENT_KEY = 'pageants-scoring-accent';

export function normalizeScoringTheme(value) {
  return value === 'light' ? 'light' : DEFAULT_SCORING_THEME;
}

export function getStoredScoringTheme() {
  if (typeof window === 'undefined') return DEFAULT_SCORING_THEME;
  return normalizeScoringTheme(window.localStorage.getItem(THEME_KEY));
}

export function persistScoringTheme(theme) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_KEY, normalizeScoringTheme(theme));
}

export function getStoredScoringAccent() {
  if (typeof window === 'undefined') return DEFAULT_SCORING_ACCENT;
  return window.localStorage.getItem(ACCENT_KEY) || DEFAULT_SCORING_ACCENT;
}

export function persistScoringAccent(accent) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCENT_KEY, accent || DEFAULT_SCORING_ACCENT);
}

export function getScoringThemeStyleVars(accent) {
  const accentColor = accent || DEFAULT_SCORING_ACCENT;
  return {
    '--color-app-accent': accentColor,
    '--color-app-accent-muted': `${accentColor}22`
  };
}

export function getScoringBodyBackground(theme) {
  return normalizeScoringTheme(theme) === 'light' ? '#f8fafc' : '#070707';
}
