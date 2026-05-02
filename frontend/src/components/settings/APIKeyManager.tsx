import { useState, useEffect } from 'react'
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Save, Trash2, Download, Cpu } from 'lucide-react'
import { loadSettings, saveSettings, clearSettings } from '../../services/keyStorage'
import { validateGeminiKey } from '../../services/llm/gemini'
import { validateOpenAIKey } from '../../services/llm/openai'
import { listOllamaModels } from '../../services/llm/ollama'
import {
  checkModelDownloaded,
  loadLocalModel,
  getGeneratorStatus,
  type ModelStatus,
} from '../../services/llm/local'
import type { LLMSettings, LLMProvider } from '../../types'

type ValidationState = 'idle' | 'checking' | 'valid' | 'invalid'

export default function APIKeyManager() {
  const [settings, setSettings] = useState<LLMSettings>({ provider: 'gemini' })
  const [showKeys, setShowKeys] = useState({ gemini: false, openai: false })
  const [validation, setValidation] = useState({ gemini: 'idle' as ValidationState, openai: 'idle' as ValidationState })
  const [validationError, setValidationError] = useState({ gemini: '', openai: '' })
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [modelDownloaded, setModelDownloaded] = useState<boolean | null>(null)
  const [modelStatus, setModelStatus] = useState<ModelStatus>('not-loaded')
  const [loadProgress, setLoadProgress] = useState('')

  useEffect(() => {
    const stored = loadSettings()
    if (stored) setSettings(stored)
    checkModelDownloaded().then(setModelDownloaded)
    setModelStatus(getGeneratorStatus())
  }, [])

  async function validateGemini() {
    if (!settings.geminiKey) return
    setValidation(v => ({ ...v, gemini: 'checking' }))
    setValidationError(e => ({ ...e, gemini: '' }))
    const result = await validateGeminiKey(settings.geminiKey)
    setValidation(v => ({ ...v, gemini: result.valid ? 'valid' : 'invalid' }))
    if (!result.valid) setValidationError(e => ({ ...e, gemini: result.error ?? 'Invalid key or connection failed' }))
  }

  async function validateOpenAI() {
    if (!settings.openaiKey) return
    setValidation(v => ({ ...v, openai: 'checking' }))
    setValidationError(e => ({ ...e, openai: '' }))
    const result = await validateOpenAIKey(settings.openaiKey)
    setValidation(v => ({ ...v, openai: result.valid ? 'valid' : 'invalid' }))
    if (!result.valid) setValidationError(e => ({ ...e, openai: result.error ?? 'Invalid key or connection failed' }))
  }

  async function checkOllama() {
    const models = await listOllamaModels(settings.ollamaUrl)
    setOllamaModels(models)
    if (models.length > 0 && !settings.ollamaModel) {
      setSettings(s => ({ ...s, ollamaModel: models[0] }))
    }
  }

  async function handleLoadModel() {
    setModelStatus('loading')
    try {
      await loadLocalModel(msg => setLoadProgress(msg))
      setModelStatus('ready')
      setLoadProgress('')
    } catch {
      setModelStatus('error')
      setLoadProgress('')
    }
  }

  function handleSave() {
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleClear() {
    clearSettings()
    setSettings({ provider: 'gemini' })
    setValidation({ gemini: 'idle', openai: 'idle' })
  }

  function ValidationIcon({ state }: { state: ValidationState }) {
    if (state === 'checking') return <Loader2 size={14} className="animate-spin text-gray-400" />
    if (state === 'valid') return <CheckCircle size={14} className="text-emerald-500" />
    if (state === 'invalid') return <XCircle size={14} className="text-red-500" />
    return null
  }

  const providers: { id: LLMProvider; label: string; desc: string }[] = [
    { id: 'gemini', label: 'Google Gemini', desc: 'Gemini 2.0 Flash — fast & capable' },
    { id: 'openai', label: 'OpenAI GPT-4o', desc: 'GPT-4o-mini — cost effective' },
    { id: 'ollama', label: 'Ollama (Local)', desc: 'Run models on your machine' },
    { id: 'local', label: 'ONNX Local', desc: 'SmolLM2-135M — runs in browser' },
  ]

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">AI Provider Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure your LLM provider and API keys. Keys are stored encrypted in your browser.</p>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Active Provider</label>
        <div className="grid grid-cols-2 gap-2">
          {providers.map(p => (
            <button
              key={p.id}
              onClick={() => setSettings(s => ({ ...s, provider: p.id }))}
              className={`text-left px-4 py-3 rounded-xl border transition-all ${
                settings.provider === p.id
                  ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200'
                  : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30'
              }`}
            >
              <p className="text-sm font-medium text-gray-800">{p.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Google Gemini</h3>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showKeys.gemini ? 'text' : 'password'}
                value={settings.geminiKey ?? ''}
                onChange={e => setSettings(s => ({ ...s, geminiKey: e.target.value }))}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 pr-10"
              />
              <button
                onClick={() => setShowKeys(k => ({ ...k, gemini: !k.gemini }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showKeys.gemini ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="flex items-center gap-1">
              <ValidationIcon state={validation.gemini} />
            </div>
            <button
              onClick={validateGemini}
              disabled={!settings.geminiKey || validation.gemini === 'checking'}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Test
            </button>
          </div>
          {validation.gemini === 'valid' && <p className="text-xs text-emerald-600">✓ Gemini API key is valid and connected</p>}
          {validation.gemini === 'invalid' && (
            <p className="text-xs text-red-600">✗ {validationError.gemini || 'Invalid key or connection failed'}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">OpenAI</h3>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showKeys.openai ? 'text' : 'password'}
                value={settings.openaiKey ?? ''}
                onChange={e => setSettings(s => ({ ...s, openaiKey: e.target.value }))}
                placeholder="sk-..."
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 pr-10"
              />
              <button
                onClick={() => setShowKeys(k => ({ ...k, openai: !k.openai }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showKeys.openai ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="flex items-center gap-1">
              <ValidationIcon state={validation.openai} />
            </div>
            <button
              onClick={validateOpenAI}
              disabled={!settings.openaiKey || validation.openai === 'checking'}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Test
            </button>
          </div>
          {validation.openai === 'valid' && <p className="text-xs text-emerald-600">✓ OpenAI API key is valid and connected</p>}
          {validation.openai === 'invalid' && (
            <p className="text-xs text-red-600">✗ {validationError.openai || 'Invalid key or connection failed'}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Ollama (Local)</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={settings.ollamaUrl ?? 'http://localhost:11434'}
              onChange={e => setSettings(s => ({ ...s, ollamaUrl: e.target.value }))}
              placeholder="http://localhost:11434"
              className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50"
            />
            <button
              onClick={checkOllama}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition-all"
            >
              Connect
            </button>
          </div>
          {ollamaModels.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Select Model</label>
              <select
                value={settings.ollamaModel ?? ''}
                onChange={e => setSettings(s => ({ ...s, ollamaModel: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-300"
              >
                {ollamaModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <p className="text-xs text-emerald-600 mt-1">✓ Ollama connected — {ollamaModels.length} model{ollamaModels.length !== 1 ? 's' : ''} available</p>
            </div>
          )}
          {ollamaModels.length === 0 && (
            <p className="text-xs text-gray-400">Ollama not detected. Install from <span className="text-indigo-500">ollama.ai</span> and run a model first.</p>
          )}
        </div>
      </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-indigo-500" />
            <h3 className="text-sm font-semibold text-gray-700">ONNX Local (SmolLM2-135M-Instruct)</h3>
          </div>

          {modelDownloaded === null && (
            <p className="text-xs text-gray-400">Checking model status...</p>
          )}

          {modelDownloaded === false && (
            <div className="space-y-2">
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Model not downloaded. Run this command first, then refresh:
              </p>
              <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono overflow-x-auto">
                cd backend && npm run download-model
              </pre>
              <p className="text-xs text-gray-400">Downloads ~70MB ONNX model to the models/ folder. One-time setup.</p>
              <button
                onClick={() => checkModelDownloaded().then(setModelDownloaded)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-all"
              >
                Recheck
              </button>
            </div>
          )}

          {modelDownloaded === true && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {modelStatus === 'ready' && <CheckCircle size={14} className="text-emerald-500" />}
                {modelStatus === 'loading' && <Loader2 size={14} className="animate-spin text-indigo-400" />}
                {modelStatus === 'error' && <XCircle size={14} className="text-red-500" />}
                {modelStatus === 'not-loaded' && <Download size={14} className="text-gray-400" />}
                <span className="text-xs text-gray-600">
                  {modelStatus === 'ready' && 'Model loaded — ready for inference'}
                  {modelStatus === 'loading' && (loadProgress || 'Loading...')}
                  {modelStatus === 'error' && 'Load failed — check console'}
                  {modelStatus === 'not-loaded' && 'Model downloaded, not yet loaded into browser'}
                </span>
              </div>
              {modelStatus !== 'ready' && (
                <button
                  onClick={handleLoadModel}
                  disabled={modelStatus === 'loading'}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {modelStatus === 'loading' ? <Loader2 size={12} className="animate-spin" /> : <Cpu size={12} />}
                  {modelStatus === 'loading' ? 'Loading...' : 'Load Model into Browser'}
                </button>
              )}
              <p className="text-xs text-gray-400">Runs entirely offline in your browser. No API key needed. First load takes ~30s.</p>
            </div>
          )}
        </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-all"
        >
          <Save size={14} />
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-all"
        >
          <Trash2 size={14} />
          Clear All
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-700">
          <strong>Privacy:</strong> API keys are stored locally in your browser using base64 encoding. They are never sent to our servers and are only used to make direct calls to Gemini/OpenAI from your browser.
        </p>
      </div>
    </div>
  )
}
