import type { LLMRequest, LLMResponse } from './types'

const MODEL_ID = 'onnx-community/SmolLM2-135M-Instruct'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _generator: any = null
let _loading = false
let _loadError: string | null = null

export type ModelStatus = 'not-downloaded' | 'not-loaded' | 'loading' | 'ready' | 'error'

export async function checkModelDownloaded(): Promise<boolean> {
  try {
    const res = await fetch(`/models/${MODEL_ID}/config.json`, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

export function getGeneratorStatus(): ModelStatus {
  if (_loadError) return 'error'
  if (_loading) return 'loading'
  if (_generator) return 'ready'
  return 'not-loaded'
}

export async function loadLocalModel(
  onProgress?: (msg: string) => void
): Promise<void> {
  if (_generator) return
  if (_loading) {
    await new Promise<void>((resolve, reject) => {
      const id = setInterval(() => {
        if (_generator) { clearInterval(id); resolve() }
        if (_loadError) { clearInterval(id); reject(new Error(_loadError!)) }
      }, 500)
    })
    return
  }

  _loading = true
  _loadError = null

  try {
    onProgress?.('Importing transformers...')
    const { pipeline, env } = await import('@huggingface/transformers')

    env.allowRemoteModels = false
    env.localModelPath = '/models/'
    // Use CDN for WASM runtime files (not model weights)
    env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/'

    onProgress?.(`Loading ${MODEL_ID} (first load may take ~30s)...`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _generator = await (pipeline as any)('text-generation', MODEL_ID, { dtype: 'q4' })
    onProgress?.('Model ready')
  } catch (err) {
    _loadError = err instanceof Error ? err.message : 'Failed to load model'
    _loading = false
    throw new Error(_loadError)
  }

  _loading = false
}

export async function callLocalModel(req: LLMRequest): Promise<LLMResponse> {
  if (!_generator) throw new Error('Local model not loaded. Click "Load Model" in Settings.')

  const doSample = (req.temperature ?? 0.7) > 0.01
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await _generator(req.messages as any, {
    max_new_tokens: req.maxTokens ?? 512,
    do_sample: doSample,
    temperature: doSample ? (req.temperature ?? 0.7) : 1.0,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastMsg = (result[0].generated_text as any[]).at(-1)
  const content: string = typeof lastMsg === 'object' ? lastMsg.content : String(lastMsg)

  return { content, provider: 'local' }
}
