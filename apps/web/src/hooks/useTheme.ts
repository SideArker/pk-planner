import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'pk_planner_theme'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem(THEME_KEY) as Theme | null
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
    return 'light'
  })

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const resolvedTheme: 'light' | 'dark' =
    theme === 'system' ? (systemIsDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const root = document.documentElement
    const isDark = resolvedTheme === 'dark'

    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {}
  }, [theme, resolvedTheme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    setThemeState(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return {
    theme,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    setTheme,
    toggleTheme,
  }
}

