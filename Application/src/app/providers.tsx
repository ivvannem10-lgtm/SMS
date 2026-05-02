'use client'
import { SessionProvider } from 'next-auth/react'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// ── Theme ──────────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark'
export type AccentColor = 'brand' | 'violet' | 'emerald' | 'orange' | 'rose'

interface ThemeCtx {
  theme: Theme
  accent: AccentColor
  setTheme: (t: Theme) => void
  setAccent: (a: AccentColor) => void
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'light', accent: 'brand',
  setTheme: () => {}, setAccent: () => {},
})

export function useTheme() { return useContext(ThemeContext) }

const ACCENT_CLASSES: Record<AccentColor, string> = {
  brand:   'accent-brand',
  violet:  'accent-violet',
  emerald: 'accent-emerald',
  orange:  'accent-orange',
  rose:    'accent-rose',
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme,  setThemeState]  = useState<Theme>('light')
  const [accent, setAccentState] = useState<AccentColor>('brand')

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const t = localStorage.getItem('sis_theme') as Theme | null
      const a = localStorage.getItem('sis_accent') as AccentColor | null
      if (t) setThemeState(t)
      if (a) setAccentState(a)
    } catch { /* ignore */ }
  }, [])

  // Apply dark class + accent class to <html>
  useEffect(() => {
    const el = document.documentElement
    if (theme === 'dark') el.classList.add('dark')
    else el.classList.remove('dark')
    // Remove all accent classes then add current
    Object.values(ACCENT_CLASSES).forEach((c) => el.classList.remove(c))
    el.classList.add(ACCENT_CLASSES[accent])
  }, [theme, accent])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    try { localStorage.setItem('sis_theme', t) } catch { /* ignore */ }
  }, [])

  const setAccent = useCallback((a: AccentColor) => {
    setAccentState(a)
    try { localStorage.setItem('sis_accent', a) } catch { /* ignore */ }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ── User profile store (localStorage-backed) ──────────────────────────────────

export interface UserProfile {
  nickname?: string
  phone?: string
  birthday?: string
  jobTitle?: string
  photoDataUrl?: string
}

export function loadProfile(userId: string): UserProfile {
  try { return JSON.parse(localStorage.getItem(`sis_profile_${userId}`) ?? '{}') }
  catch { return {} }
}
export function saveProfile(userId: string, data: UserProfile) {
  try { localStorage.setItem(`sis_profile_${userId}`, JSON.stringify(data)) }
  catch { /* ignore */ }
}

// ── Root provider ─────────────────────────────────────────────────────────────

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  )
}
