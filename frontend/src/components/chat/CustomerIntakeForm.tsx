import { useState } from 'react'
import {
  User, Phone, Mail, DollarSign, MapPin, Home,
  Users, FileText, Save, RotateCcw, CheckCircle, Loader2,
} from 'lucide-react'
import { customersApi } from '../../services/api'
import { getDefaultSettings } from '../../services/keyStorage'

export interface IntakeData {
  name: string
  phone: string
  email: string
  budget: string
  location: string
  propertyType: string
  bedrooms: string
  intent: string
  notes: string
}

export const EMPTY_INTAKE: IntakeData = {
  name: '', phone: '', email: '', budget: '', location: '',
  propertyType: '', bedrooms: '', intent: '', notes: '',
}

interface Props {
  data: IntakeData
  onChange: (field: keyof IntakeData, value: string) => void
  onCustomerSaved: (customerId: string) => void
}

export default function CustomerIntakeForm({ data, onChange, onCustomerSaved }: Props) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [savedId, setSavedId] = useState<string | null>(null)

  const settings = getDefaultSettings()

  async function handleSave() {
    if (!data.name.trim()) return
    setStatus('saving')

    const llmSource =
      settings.provider === 'gemini' ? 'cloud_gemini' :
      settings.provider === 'openai' ? 'cloud_openai' :
      settings.provider === 'ollama' ? 'ollama' : 'local'

    const preferences = {
      ...(data.propertyType && { propertyType: data.propertyType }),
      ...(data.bedrooms && { bedrooms: parseInt(data.bedrooms) }),
      ...(data.intent && { intent: data.intent }),
      ...(data.phone && { phone: data.phone }),
      ...(data.email && { email: data.email }),
    }

    const payload = {
      name: data.name.trim(),
      ...(data.budget && { budget: parseFloat(data.budget) }),
      ...(data.location && { location: data.location }),
      ...(data.notes && { notes: data.notes }),
      ...(Object.keys(preferences).length && { preferences }),
      llm_source: llmSource,
    }

    try {
      let customer
      if (savedId) {
        customer = await customersApi.update(savedId, payload)
      } else {
        customer = await customersApi.create(payload)
        setSavedId(customer.customer_id)
      }
      setStatus('idle')
      onCustomerSaved(customer.customer_id)
    } catch {
      setStatus('error')
    }
  }

  function handleClear() {
    Object.keys(EMPTY_INTAKE).forEach(k => onChange(k as keyof IntakeData, ''))
    setStatus('idle')
    setSavedId(null)
  }

  const inputCls =
    'w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-300 dark:focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 dark:focus:ring-indigo-900/30 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-all'
  const labelCls = 'text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1'
  const iconCls = 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none'

  return (
    <div
      className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shrink-0"
      style={{ width: 340 }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Customer Intake</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Fill as you go — save anytime</p>
          </div>
          <button
            onClick={handleClear}
            title="Clear form"
            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all"
          >
            <RotateCcw size={14} />
          </button>
        </div>
        {savedId && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={12} />
            Saved — {data.name || 'customer'}
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
        {/* Name */}
        <div>
          <label className={labelCls}>Full Name *</label>
          <div className="relative">
            <User size={13} className={iconCls} />
            <input
              value={data.name}
              onChange={e => onChange('name', e.target.value)}
              placeholder="e.g. Sarah Mitchell"
              className={`${inputCls} pl-8`}
            />
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className={labelCls}>Budget (AUD)</label>
          <div className="relative">
            <DollarSign size={13} className={iconCls} />
            <input
              type="number"
              value={data.budget}
              onChange={e => onChange('budget', e.target.value)}
              placeholder="e.g. 850000"
              className={`${inputCls} pl-8`}
            />
          </div>
          {data.budget && !isNaN(parseFloat(data.budget)) && (
            <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">
              = ${parseFloat(data.budget) >= 1e6
                ? `${(parseFloat(data.budget) / 1e6).toFixed(2)}M`
                : `${(parseFloat(data.budget) / 1000).toFixed(0)}K`}
            </p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className={labelCls}>Preferred Location</label>
          <div className="relative">
            <MapPin size={13} className={iconCls} />
            <input
              value={data.location}
              onChange={e => onChange('location', e.target.value)}
              placeholder="e.g. North Sydney"
              className={`${inputCls} pl-8`}
            />
          </div>
        </div>

        {/* Property Type + Bedrooms */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Property Type</label>
            <div className="relative">
              <Home size={13} className={iconCls} />
              <select
                value={data.propertyType}
                onChange={e => onChange('propertyType', e.target.value)}
                className={`${inputCls} pl-8 appearance-none cursor-pointer`}
              >
                <option value="">Any</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="townhouse">Townhouse</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Bedrooms</label>
            <div className="relative">
              <Users size={13} className={iconCls} />
              <select
                value={data.bedrooms}
                onChange={e => onChange('bedrooms', e.target.value)}
                className={`${inputCls} pl-8 appearance-none cursor-pointer`}
              >
                <option value="">Any</option>
                <option value="1">1 BR</option>
                <option value="2">2 BR</option>
                <option value="3">3 BR</option>
                <option value="4">4 BR</option>
                <option value="5">5+ BR</option>
              </select>
            </div>
          </div>
        </div>

        {/* Intent */}
        <div>
          <label className={labelCls}>Purchase Intent</label>
          <div className="flex gap-2">
            {(['investment', 'personal'] as const).map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => onChange('intent', data.intent === opt ? '' : opt)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                  data.intent === opt
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-400'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-200 dark:hover:border-indigo-700'
                }`}
              >
                {opt === 'investment' ? 'Investment' : 'To Live In'}
              </button>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Phone</label>
            <div className="relative">
              <Phone size={13} className={iconCls} />
              <input
                value={data.phone}
                onChange={e => onChange('phone', e.target.value)}
                placeholder="04xx xxx xxx"
                className={`${inputCls} pl-8`}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <div className="relative">
              <Mail size={13} className={iconCls} />
              <input
                value={data.email}
                onChange={e => onChange('email', e.target.value)}
                placeholder="email@..."
                className={`${inputCls} pl-8`}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={labelCls}>Session Notes</label>
          <div className="relative">
            <FileText size={13} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <textarea
              value={data.notes}
              onChange={e => onChange('notes', e.target.value)}
              placeholder="Key points from the conversation..."
              rows={4}
              className={`${inputCls} pl-8 resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
        <button
          onClick={handleSave}
          disabled={!data.name.trim() || status === 'saving'}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {status === 'saving' ? (
            <><Loader2 size={14} className="animate-spin" /> Saving...</>
          ) : (
            <><Save size={14} /> {savedId ? 'Update CRM' : 'Save to CRM'}</>
          )}
        </button>
        {status === 'error' && (
          <p className="text-xs text-red-500 text-center mt-2">Save failed — check connection</p>
        )}
      </div>
    </div>
  )
}
