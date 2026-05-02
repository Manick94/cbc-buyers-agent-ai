import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('bac_dark_mode')
      if (stored !== null) return stored === 'true'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return false
    }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('bac_dark_mode', String(isDark))
  }, [isDark])

  return { isDark, toggle: () => setIsDark(d => !d) }
}
