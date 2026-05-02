import { useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Save, Trash2, Cpu, FolderOpen, FileUp } from 'lucide-react'
import { loadSettings, saveSettings, clearSettings } from '../../services/keyStorage'
import { validateGeminiKey } from '../../services/llm/gemini'
import { validateOpenAIKey } from '../../services/llm/openai'
import { validateOpenRouterKey, OPENROUTER_MODELS } from '../../services/llm/openrouter'
import { listOllamaModels } from '../../services/llm/ollama'
import {
  getLocalModelStatus,
  loadLocalModel,
  isSmolLM2Stored,
  storeSmolLM2,
  clearSmolLM2,
  isGemmaStored,
  storeGemma,
  clearGemma,
  type ModelStatus,
} from '../../services/llm/local'
import type { LLMSettings, LLMProvider, LocalModelType } from '../../types'

type ValidationState = 'idle' | 'checking' | 'valid' | 'invalid'

export default function APIKeyManager() {
  const [settings, setSettings] = useState<LLMSettings>({ provider: 'gemini' })
  const [showKeys, setShowKeys] = useState({ gemini: false, openai: false, openrouter: false })
  const [validation, setValidation] = useState({
    gemini: 'idle' as ValidationState,
    openai: 'idle' as ValidationState,
    openrouter: 'idle' as ValidationState,
  })
  const [validationError, setValidationError] = useState({ gemini: '', openai: '', openrouter: '' })
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [customOrModel, setCustomOrModel] = useState('')

  // Local model state
  const [smolStored, setSmolStored] = useState(false)
  const [gemmaStored, setGemmaStored] = useState(false)
  const [localStatus, setLocalStatus] = useState<ModelStatus>('not-loaded')
  const [localProgress, setLocalProgress] = useState('')
  const [storeProgress, setStoreProgress] = useState('')
  const gemmaInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = loadSettings()
    if (stored) {
      setSettings(stored)
      if (stored.openrouterModel && !OPENROUTER_MODELS.find(m => m.id === stored.openrouterModel)) {
        setCustomOrModel(stored.openrouterModel)
      }
    }
    isSmolLM2Stored().then(setSmolStored)
    isGemmaStored().then(setGemmaStored)
    setLocalStatus(getLocalModelStatus())
  }, [])

  // --- Validation ---
  async function validateGemini() {
    if (!settings.geminiKey) return
    setValidation(v => ({ ...v, gemini: 'checking' }))
    setValidationError(e => ({ ...e, gemini: '' }))
    const r = await validateGeminiKey(settings.geminiKey)
    setValidation(v => ({ ...v, gemini: r.valid ? 'valid' : 'invalid' }))
    if (!r.valid) setValidationError(e => ({ ...e, gemini: r.error ?? 'Invalid key' }))
  }

  async function validateOpenAI() {
    if (!settings.openaiKey) return
    setValidation(v => ({ ...v, openai: 'checking' }))
    setValidationError(e => ({ ...e, openai: '' }))
    const r = await validateOpenAIKey(settings.openaiKey)
    setValidation(v => ({ ...v, openai: r.valid ? 'valid' : 'invalid' }))
    if (!r.valid) setValidationError(e => ({ ...e, openai: r.error ?? 'Invalid key' }))
  }

  async function validateOpenRouter() {
    if (!settings.openrouterKey) return
    setValidation(v => ({ ...v, openrouter: 'checking' }))
    setValidationError(e => ({ ...e, openrouter: '' }))
    const r = await validateOpenRouterKey(settings.openrouterKey)
    setValidation(v => ({ ...v, openrouter: r.valid ? 'valid' : 'invalid' }))
    if (!r.valid) setValidationError(e => ({ ...e, openrouter: r.error ?? 'Invalid key' }))
  }

  async function checkOllama() {
    const models = await listOllamaModels(settings.ollamaUrl)
    setOllamaModels(models)
    if (models.length > 0 && !settings.ollamaModel) {
      setSettings(s => ({ ...s, ollamaModel: models[0] }))
    }
  }

  // --- Local model actions ---
  async function handleSelectSmolLM2Folder() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dir = await (window as any).showDirectoryPicker({ mode: 'read' })
      setStoreProgress('Reading folder…')
      await storeSmolLM2(dir, setStoreProgress)
      setSmolStored(true)
      setStoreProgress('')
      setSettings(s => ({ ...s, localModelType: 'smollm2' }))
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        setStoreProgress('Failed: ' + ((err as Error)?.message ?? 'Unknown error'))
      } else {
        setStoreProgress('')
      }
    }
  }

  async function handleSelectGemmaFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setStoreProgress('Reading file…')
    try {
      await storeGemma(file, setStoreProgress)
      setGemmaStored(true)
      setStoreProgress('')
      setSettings(s => ({ ...s, localModelType: 'gemma4b' }))
    } catch (err) {
      setStoreProgress('Failed: ' + ((err as Error)?.message ?? 'Unknown error'))
    }
    e.target.value = ''
  }

  async function handleClearSmolLM2() {
    await clearSmolLM2()
    setSmolStored(false)
    setLocalStatus('not-loaded')
  }

  async function handleClearGemma() {
    await clearGemma()
    setGemmaStored(false)
    setLocalStatus('not-loaded')
  }

  async function handleLoadModel() {
    const type: LocalModelType = settings.localModelType ?? 'smollm2'
    setLocalStatus('loading')
    setLocalProgress('')
    try {
      await loadLocalModel(type, setLocalProgress)
      setLocalStatus('ready')
      setLocalProgress('')
    } catch (err) {
      setLocalStatus('error')
      setLocalProgress((err as Error)?.message ?? 'Load failed')
    }
  }

  function handleSave() {
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleClearAll() {
    clearSettings()
    setSettings({ provider: 'gemini' })
    setValidation({ gemini: 'idle', openai: 'idle', openrouter: 'idle' })
  }

  function ValidationIcon({ state }: { state: ValidationState }) {
    if (state === 'checking') return <Loader2 size={14} className="animate-spin text-gray-400" />
    if (state === 'valid') return <CheckCircle size={14} className="text-emerald-500" />
    if (state === 'invalid') return <XCircle size={14} className="text-red-500" />
    return null
  }

  const providers: { id: LLMProvider; label: string; desc: string }[] = [
    { id: 'gemini', label: 'Google Gemini', desc: 'Gemini 2.0 Flash' },
    { id: 'openai', label: 'OpenAI GPT-4o', desc: 'GPT-4o-mini' },
    { id: 'openrouter', label: 'OpenRouter', desc: 'Multi-model gateway' },
    { id: 'ollama', label: 'Ollama (Local)', desc: 'Self-hosted models' },
    { id: 'local', label: 'Local (Offline)', desc: 'ONNX / MediaPipe' },
  ]

  const activeLocalType = settings.localModelType ?? 'smollm2'
  const activeLocalStored = activeLocalType === 'smollm2' ? smolStored : gemmaStored

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Provider Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure LLM provider and API keys. Keys stored locally in browser.</p>
      </div>

      {/* Provider grid */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Active Provider</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {providers.map(p => (
            <button
              key={p.id}
              onClick={() => setSettings(s => ({ ...s, provider: p.id }))}
              className={`text-left px-4 py-3 rounded-xl border transition-all ${
                settings.provider === p.id
                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950 ring-1 ring-indigo-200'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-200 hover:bg-indigo-50/30'
              }`}
            >
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{p.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">

        {/* Gemini */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Google Gemini</h3>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showKeys.gemini ? 'text' : 'password'}
                value={settings.geminiKey ?? ''}
                onChange={e => setSettings(s => ({ ...s, geminiKey: e.target.value }))}
                placeholder="AIzaSy…"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 pr-10 dark:text-gray-200"
              />
              <button onClick={() => setShowKeys(k => ({ ...k, gemini: !k.gemini }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showKeys.gemini ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="flex items-center"><ValidationIcon state={validation.gemini} /></div>
            <button onClick={validateGemini} disabled={!settings.geminiKey || validation.gemini === 'checking'}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm hover:bg-gray-200 disabled:opacity-40 transition-all">Test</button>
          </div>
          {validation.gemini === 'valid' && <p className="text-xs text-emerald-600">✓ Gemini key valid</p>}
          {validation.gemini === 'invalid' && <p className="text-xs text-red-600">✗ {validationError.gemini || 'Invalid key'}</p>}
        </div>

        {/* OpenAI */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">OpenAI</h3>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showKeys.openai ? 'text' : 'password'}
                value={settings.openaiKey ?? ''}
                onChange={e => setSettings(s => ({ ...s, openaiKey: e.target.value }))}
                placeholder="sk-…"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 pr-10 dark:text-gray-200"
              />
              <button onClick={() => setShowKeys(k => ({ ...k, openai: !k.openai }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showKeys.openai ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="flex items-center"><ValidationIcon state={validation.openai} /></div>
            <button onClick={validateOpenAI} disabled={!settings.openaiKey || validation.openai === 'checking'}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm hover:bg-gray-200 disabled:opacity-40 transition-all">Test</button>
          </div>
          {validation.openai === 'valid' && <p className="text-xs text-emerald-600">✓ OpenAI key valid</p>}
          {validation.openai === 'invalid' && <p className="text-xs text-red-600">✗ {validationError.openai || 'Invalid key'}</p>}
        </div>

        {/* OpenRouter */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">OpenRouter</h3>
          <p className="text-xs text-gray-400">100+ models via one key. Many free models available. Get key at <span className="text-indigo-500">openrouter.ai</span></p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showKeys.openrouter ? 'text' : 'password'}
                value={settings.openrouterKey ?? ''}
                onChange={e => setSettings(s => ({ ...s, openrouterKey: e.target.value }))}
                placeholder="sk-or-…"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 pr-10 dark:text-gray-200"
              />
              <button onClick={() => setShowKeys(k => ({ ...k, openrouter: !k.openrouter }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showKeys.openrouter ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="flex items-center"><ValidationIcon state={validation.openrouter} /></div>
            <button onClick={validateOpenRouter} disabled={!settings.openrouterKey || validation.openrouter === 'checking'}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm hover:bg-gray-200 disabled:opacity-40 transition-all">Test</button>
          </div>
          {validation.openrouter === 'valid' && <p className="text-xs text-emerald-600">✓ OpenRouter key valid</p>}
          {validation.openrouter === 'invalid' && <p className="text-xs text-red-600">✗ {validationError.openrouter || 'Invalid key'}</p>}
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Model</label>
            <select
              value={
                !settings.openrouterModel
                  ? OPENROUTER_MODELS[0].id
                  : OPENROUTER_MODELS.find(m => m.id === settings.openrouterModel && m.id !== 'custom')
                    ? settings.openrouterModel
                    : 'custom'
              }
              onChange={e => {
                if (e.target.value === 'custom') {
                  setSettings(s => ({ ...s, openrouterModel: customOrModel || undefined }))
                } else {
                  setSettings(s => ({ ...s, openrouterModel: e.target.value }))
                }
              }}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-300 dark:text-gray-200"
            >
              {OPENROUTER_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            {(settings.openrouterModel === 'custom' || (settings.openrouterModel && !OPENROUTER_MODELS.find(m => m.id === settings.openrouterModel && m.id !== 'custom'))) && (
              <input
                type="text"
                value={customOrModel}
                onChange={e => {
                  setCustomOrModel(e.target.value)
                  setSettings(s => ({ ...s, openrouterModel: e.target.value || undefined }))
                }}
                placeholder="e.g. anthropic/claude-3.5-sonnet"
                className="mt-2 w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-300 dark:text-gray-200"
              />
            )}
          </div>
        </div>

        {/* Ollama */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ollama (Local Server)</h3>
          <div className="flex gap-2">
            <input type="text" value={settings.ollamaUrl ?? 'http://localhost:11434'}
              onChange={e => setSettings(s => ({ ...s, ollamaUrl: e.target.value }))}
              placeholder="http://localhost:11434"
              className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-indigo-300 dark:text-gray-200"
            />
            <button onClick={checkOllama} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm hover:bg-gray-200 transition-all">Connect</button>
          </div>
          {ollamaModels.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Model</label>
              <select value={settings.ollamaModel ?? ''} onChange={e => setSettings(s => ({ ...s, ollamaModel: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-gray-200">
                {ollamaModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <p className="text-xs text-emerald-600 mt-1">✓ {ollamaModels.length} model{ollamaModels.length !== 1 ? 's' : ''} available</p>
            </div>
          )}
          {ollamaModels.length === 0 && <p className="text-xs text-gray-400">Not detected. Install from ollama.ai and run a model.</p>}
        </div>

        {/* Local Model */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-indigo-500" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Local Model (Offline)</h3>
          </div>

          {/* Model type toggle */}
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">Model</label>
            <div className="flex gap-2">
              {([
                { id: 'smollm2', label: 'SmolLM2-135M', sub: 'ONNX / transformers.js' },
                { id: 'gemma4b', label: 'Gemma 4B', sub: 'MediaPipe .task file' },
              ] as { id: LocalModelType; label: string; sub: string }[]).map(opt => (
                <button key={opt.id}
                  onClick={() => setSettings(s => ({ ...s, localModelType: opt.id }))}
                  className={`flex-1 text-left px-3 py-2.5 rounded-xl border transition-all ${
                    activeLocalType === opt.id
                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-indigo-200'
                  }`}
                >
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{opt.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* SmolLM2 section */}
          {activeLocalType === 'smollm2' && (
            <div className="space-y-2">
              {smolStored ? (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <CheckCircle size={13} /> Model files stored in browser
                  </span>
                  <button onClick={handleClearSmolLM2} className="text-xs text-red-400 hover:text-red-600">Clear</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select the SmolLM2-135M-Instruct folder (contains config.json, tokenizer.json, onnx/ subfolder).
                  </p>
                  <button onClick={handleSelectSmolLM2Folder}
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-medium hover:bg-indigo-100 transition-all">
                    <FolderOpen size={13} /> Select Model Folder
                  </button>
                </div>
              )}
              {storeProgress && activeLocalType === 'smollm2' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{storeProgress}</p>
              )}
            </div>
          )}

          {/* Gemma section */}
          {activeLocalType === 'gemma4b' && (
            <div className="space-y-2">
              {gemmaStored ? (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <CheckCircle size={13} /> Gemma .task file stored in browser
                  </span>
                  <button onClick={handleClearGemma} className="text-xs text-red-400 hover:text-red-600">Clear</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select the Gemma .task file (MediaPipe format, e.g. gemma3-4b-it-int4.task).
                  </p>
                  <button onClick={() => gemmaInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-medium hover:bg-indigo-100 transition-all">
                    <FileUp size={13} /> Select .task File
                  </button>
                  <input ref={gemmaInputRef} type="file" accept=".task,.bin" className="hidden" onChange={handleSelectGemmaFile} />
                </div>
              )}
              {storeProgress && activeLocalType === 'gemma4b' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{storeProgress}</p>
              )}
            </div>
          )}

          {/* Load into memory */}
          {activeLocalStored && localStatus !== 'ready' && (
            <button onClick={handleLoadModel} disabled={localStatus === 'loading'}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-500 text-white rounded-xl text-xs font-medium hover:bg-indigo-600 disabled:opacity-40 transition-all">
              {localStatus === 'loading' ? <Loader2 size={13} className="animate-spin" /> : <Cpu size={13} />}
              {localStatus === 'loading' ? 'Loading…' : 'Load into Memory'}
            </button>
          )}

          {localStatus === 'ready' && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-600">
              <CheckCircle size={13} /> Model loaded — ready for inference
            </p>
          )}
          {localStatus === 'error' && (
            <p className="text-xs text-red-600">✗ {localProgress || 'Load failed — check console'}</p>
          )}
          {localStatus === 'loading' && localProgress && (
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{localProgress}</p>
          )}

          <p className="text-xs text-gray-400">Files stored in IndexedDB — persist across page refreshes. Re-select only to change model.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-all">
          <Save size={14} />
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
        <button onClick={handleClearAll}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-all">
          <Trash2 size={14} />
          Clear All
        </button>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-700 dark:text-amber-300">
          <strong>Privacy:</strong> API keys stored locally via base64. Local model files stored in browser IndexedDB. Nothing sent to our servers.
        </p>
      </div>
    </div>
  )
}
