import type { LLMRequest, LLMResponse } from './types'
import type { LocalModelType } from '../../types'
import {
  loadSmolLM2, callSmolLM2, isSmolLM2Stored, storeSmolLM2, clearSmolLM2,
} from './local-smollm2'
import {
  loadGemma, callGemma, isGemmaStored, storeGemma, clearGemma,
} from './local-gemma'

export type ModelStatus = 'not-stored' | 'not-loaded' | 'loading' | 'ready' | 'error'

let _status: ModelStatus = 'not-loaded'

export function getLocalModelStatus(): ModelStatus { return _status }

export async function loadLocalModel(
  type: LocalModelType,
  onProgress?: (msg: string) => void
): Promise<void> {
  _status = 'loading'
  try {
    if (type === 'smollm2') await loadSmolLM2(onProgress)
    else await loadGemma(onProgress)
    _status = 'ready'
  } catch (err) {
    _status = 'error'
    throw err
  }
}

export async function callLocalModel(req: LLMRequest, type: LocalModelType): Promise<LLMResponse> {
  if (type === 'smollm2') return callSmolLM2(req)
  return callGemma(req)
}

export { isSmolLM2Stored, storeSmolLM2, clearSmolLM2, isGemmaStored, storeGemma, clearGemma }
