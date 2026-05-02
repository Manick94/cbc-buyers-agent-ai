import type { LLMRequest, LLMResponse } from './types'
import type { ValidationResult } from './gemini'

const BASE = 'https://openrouter.ai/api/v1'
const DEFAULT_MODEL = 'meta-llama/llama-3.1-8b-instruct:free'

export const OPENROUTER_MODELS = [
  { id: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (free)' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (free)' },
  { id: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B (free)' },
  { id: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (free)' },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', label: 'Phi-3 Mini (free)' },
  { id: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'custom', label: 'Custom model ID…' },
]

export async function callOpenRouter(
  req: LLMRequest,
  apiKey: string,
  model?: string
): Promise<LLMResponse> {
  const response = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'AI Buyers Agent',
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 1024,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as any)?.error?.message ?? `OpenRouter error ${response.status}`)
  }

  const data = await response.json()
  return { content: data.choices[0].message.content, provider: 'openrouter' }
}

export async function validateOpenRouterKey(apiKey: string): Promise<ValidationResult> {
  try {
    const response = await fetch(`${BASE}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (response.ok) return { valid: true }
    const err = await response.json().catch(() => ({}))
    return { valid: false, error: (err as any)?.error?.message ?? `HTTP ${response.status}` }
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}
