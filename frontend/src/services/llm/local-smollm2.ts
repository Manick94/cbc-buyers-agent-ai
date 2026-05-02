import type { LLMRequest, LLMResponse } from './types'
import { storeFile, getFile, clearPrefix, isModelStored } from './local-idb'

const MODEL_ID = 'onnx-community/SmolLM2-135M-Instruct'
const IDB_PREFIX = 'smollm2'
const INTERCEPT_BASE = `/models/local-user/${MODEL_ID}/`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _generator: any = null
let _fetchPatched = false

async function readDirRecursive(
  dir: FileSystemDirectoryHandle,
  prefix = ''
): Promise<Map<string, ArrayBuffer>> {
  const result = new Map<string, ArrayBuffer>()
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind === 'file') {
      const file = await (handle as FileSystemFileHandle).getFile()
      result.set(prefix + name, await file.arrayBuffer())
    } else if (handle.kind === 'directory') {
      const sub = await readDirRecursive(handle as FileSystemDirectoryHandle, prefix + name + '/')
      sub.forEach((v, k) => result.set(k, v))
    }
  }
  return result
}

export async function storeSmolLM2(
  dirHandle: FileSystemDirectoryHandle,
  onProgress?: (msg: string) => void
): Promise<void> {
  await clearPrefix(IDB_PREFIX + '/')
  const files = await readDirRecursive(dirHandle)
  let i = 0
  for (const [path, buffer] of files) {
    onProgress?.(`Storing ${path} (${++i}/${files.size})…`)
    await storeFile(`${IDB_PREFIX}/${path}`, buffer)
  }
}

export function isSmolLM2Stored(): Promise<boolean> {
  return isModelStored(IDB_PREFIX)
}

export function clearSmolLM2(): Promise<void> {
  _generator = null
  return clearPrefix(IDB_PREFIX + '/')
}

function patchFetch() {
  if (_fetchPatched) return
  _fetchPatched = true
  const _orig = globalThis.fetch.bind(globalThis)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.fetch = async (input: any, init?: RequestInit) => {
    const url: string =
      typeof input === 'string' ? input
      : input instanceof URL ? input.href
      : (input as Request).url
    if (url.includes(INTERCEPT_BASE)) {
      const rel = decodeURIComponent(url.split(INTERCEPT_BASE)[1].split('?')[0])
      const buffer = await getFile(`${IDB_PREFIX}/${rel}`)
      if (buffer) return new Response(buffer, { status: 200 })
    }
    return _orig(input, init)
  }
}

export async function loadSmolLM2(onProgress?: (msg: string) => void): Promise<void> {
  if (_generator) return
  patchFetch()
  onProgress?.('Importing transformers…')
  const { pipeline, env } = await import('@huggingface/transformers')
  env.allowRemoteModels = false
  env.localModelPath = '/models/local-user/'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(env.backends as any).onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/'
  onProgress?.('Loading SmolLM2 from storage (first load ~30s)…')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _generator = await (pipeline as any)('text-generation', MODEL_ID, { dtype: 'q4' })
}

export async function callSmolLM2(req: LLMRequest): Promise<LLMResponse> {
  if (!_generator) throw new Error('SmolLM2 not loaded. Click Load Model in Settings.')
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
