import type { LLMSettings } from '../types'

const STORAGE_KEY = 'bac_llm_settings'

export function saveSettings(settings: LLMSettings): void {
  localStorage.setItem(STORAGE_KEY, btoa(JSON.stringify(settings)))
}

export function loadSettings(): LLMSettings | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try { return JSON.parse(atob(raw)) as LLMSettings } catch { return null }
}

export function clearSettings(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function getDefaultSettings(): LLMSettings {
  return loadSettings() ?? { provider: 'gemini' }
}
