import type { LLMRequest, LLMResponse } from './types'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const GEMINI_MODEL = 'gemini-2.0-flash'

export async function callGemini(req: LLMRequest, apiKey: string): Promise<LLMResponse> {
  const systemMsg = req.messages.find(m => m.role === 'system')
  const userMsgs = req.messages.filter(m => m.role !== 'system')

  const body: Record<string, unknown> = {
    contents: userMsgs.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature: req.temperature ?? 0.7,
      maxOutputTokens: req.maxTokens ?? 1024,
    },
  }

  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] }
  }

  const response = await fetch(
    `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as any)?.error?.message ?? `Gemini API error ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned empty response')
  return { content: text, provider: 'gemini' }
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

export async function validateGeminiKey(apiKey: string): Promise<ValidationResult> {
  try {
    const response = await fetch(
      `${GEMINI_BASE}/models?key=${apiKey}`,
      { method: 'GET' }
    )
    if (response.ok) return { valid: true }
    const err = await response.json().catch(() => ({}))
    const msg = (err as any)?.error?.message ?? `HTTP ${response.status}`
    return { valid: false, error: msg }
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : 'Network error — check your connection' }
  }
}
