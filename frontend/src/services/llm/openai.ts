import type { LLMRequest, LLMResponse } from './types'
import type { ValidationResult } from './gemini'

export async function callOpenAI(req: LLMRequest, apiKey: string): Promise<LLMResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 1024,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as any)?.error?.message ?? `OpenAI API error ${response.status}`)
  }

  const data = await response.json()
  return { content: data.choices[0].message.content, provider: 'openai' }
}

export async function validateOpenAIKey(apiKey: string): Promise<ValidationResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (response.ok) return { valid: true }
    const err = await response.json().catch(() => ({}))
    const msg = (err as any)?.error?.message ?? `HTTP ${response.status}`
    return { valid: false, error: msg }
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : 'Network error — check your connection' }
  }
}
