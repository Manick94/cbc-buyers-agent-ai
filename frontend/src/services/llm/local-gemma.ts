import type { LLMRequest, LLMResponse } from './types'
import { storeFile, getFile, clearPrefix, isModelStored } from './local-idb'

const IDB_KEY = 'gemma/model.task'
const IDB_PREFIX = 'gemma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _inference: any = null

export async function storeGemma(file: File, onProgress?: (msg: string) => void): Promise<void> {
  onProgress?.(`Reading ${file.name} (${(file.size / 1024 / 1024).toFixed(0)} MB)…`)
  await clearPrefix(IDB_PREFIX + '/')
  const buffer = await file.arrayBuffer()
  onProgress?.('Storing in browser IndexedDB…')
  await storeFile(IDB_KEY, buffer)
}

export function isGemmaStored(): Promise<boolean> {
  return isModelStored(IDB_PREFIX)
}

export function clearGemma(): Promise<void> {
  _inference = null
  return clearPrefix(IDB_PREFIX + '/')
}

export async function loadGemma(onProgress?: (msg: string) => void): Promise<void> {
  if (_inference) return
  const buffer = await getFile(IDB_KEY)
  if (!buffer) throw new Error('Gemma model not in storage. Select .task file in Settings.')
  onProgress?.('Loading MediaPipe runtime…')
  // Dynamic import to avoid bundling unless needed
  const { FilesetResolver, LlmInference } = await import('@mediapipe/tasks-genai')
  const genai = await FilesetResolver.forGenAiTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm'
  )
  onProgress?.(`Loading Gemma (${(buffer.byteLength / 1024 / 1024).toFixed(0)} MB) into WebGPU…`)
  _inference = await LlmInference.createFromOptions(genai, {
    baseOptions: { modelAssetBuffer: new Uint8Array(buffer) },
    maxTokens: 1024,
    topK: 40,
    temperature: 0.8,
    randomSeed: 101,
  })
}

function buildGemmaPrompt(req: LLMRequest): string {
  const system = req.messages.find(m => m.role === 'system')?.content ?? ''
  const turns = req.messages.filter(m => m.role !== 'system')
  const parts: string[] = []
  if (system) {
    parts.push(`<start_of_turn>user\n${system}<end_of_turn>`)
    parts.push('<start_of_turn>model\nUnderstood.<end_of_turn>')
  }
  for (const m of turns) {
    const role = m.role === 'user' ? 'user' : 'model'
    parts.push(`<start_of_turn>${role}\n${m.content}<end_of_turn>`)
  }
  parts.push('<start_of_turn>model\n')
  return parts.join('\n')
}

export async function callGemma(req: LLMRequest): Promise<LLMResponse> {
  if (!_inference) throw new Error('Gemma not loaded. Click Load Model in Settings.')
  const prompt = buildGemmaPrompt(req)
  const content: string = await _inference.generateResponse(prompt)
  return { content, provider: 'local' }
}
