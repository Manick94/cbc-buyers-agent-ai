import type { LLMRequest, LLMResponse } from './types'

export async function callOllama(
  req: LLMRequest,
  url = 'http://localhost:11434',
  model = 'llama3.2'
): Promise<LLMResponse> {
  const response = await fetch(`${url}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: req.messages,
      stream: false,
      options: { temperature: req.temperature ?? 0.7, num_predict: req.maxTokens ?? 1024 },
    }),
  })

  if (!response.ok) throw new Error(`Ollama ${response.status}: ${response.statusText}`)

  const data = await response.json()
  return { content: data.message.content, provider: 'ollama' }
}

export async function listOllamaModels(url = 'http://localhost:11434'): Promise<string[]> {
  try {
    const r = await fetch(`${url}/api/tags`)
    if (!r.ok) return []
    const data = await r.json()
    return (data.models ?? []).map((m: { name: string }) => m.name)
  } catch { return [] }
}
