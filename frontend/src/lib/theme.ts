export type ThemeColor = 'rose' | 'mint' | 'blue'

export const THEMES: Record<ThemeColor, { label: string; accent: string; light: string; dark: string }> = {
  rose: { label: 'Rosé',  accent: '#D4848E', light: '#fdf0f1', dark: '#b86870' },
  mint: { label: 'Mint',  accent: '#5BA898', light: '#eaf4f1', dark: '#3d7a6d' },
  blue: { label: 'Blau',  accent: '#6A9EC2', light: '#eef4f9', dark: '#4a7a9b' },
}

export function getTheme(): ThemeColor {
  const stored = localStorage.getItem('salon_theme') as ThemeColor | null
  return stored && THEMES[stored] ? stored : 'rose'
}

export function setTheme(theme: ThemeColor) {
  localStorage.setItem('salon_theme', theme)
  applyTheme(theme)
}

export function applyTheme(theme: ThemeColor) {
  const t = THEMES[theme]
  const root = document.documentElement
  root.style.setProperty('--accent',       t.accent)
  root.style.setProperty('--accent-light', t.light)
  root.style.setProperty('--accent-dark',  t.dark)
}
