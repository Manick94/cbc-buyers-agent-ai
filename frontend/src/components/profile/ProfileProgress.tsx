import { User, DollarSign, MapPin, Home, BedDouble, Target, Phone, FileText } from 'lucide-react'

export interface MergedProfile {
  name?: string
  budget?: number
  location?: string
  propertyType?: string
  bedrooms?: number
  intent?: string
  contact?: string
  notes?: string
  sources?: Record<string, 'form' | 'chat'>
}

interface Props {
  profile: MergedProfile
}

const FIELDS: {
  key: keyof MergedProfile
  label: string
  icon: React.ElementType
  format: (v: unknown) => string
}[] = [
  { key: 'name', label: 'Name', icon: User, format: v => String(v) },
  {
    key: 'budget', label: 'Budget', icon: DollarSign,
    format: v => {
      const n = Number(v)
      return n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${(n / 1000).toFixed(0)}K`
    },
  },
  { key: 'location', label: 'Location', icon: MapPin, format: v => String(v) },
  { key: 'propertyType', label: 'Type', icon: Home, format: v => String(v) },
  { key: 'bedrooms', label: 'Bedrooms', icon: BedDouble, format: v => `${v} BR` },
  {
    key: 'intent', label: 'Intent', icon: Target,
    format: v => v === 'investment' ? 'Investment' : 'Personal use',
  },
  { key: 'contact', label: 'Contact', icon: Phone, format: v => String(v) },
  {
    key: 'notes', label: 'Notes', icon: FileText,
    format: v => { const s = String(v); return s.length > 28 ? s.slice(0, 28) + '…' : s },
  },
]

import React from 'react'

export default function ProfileProgress({ profile }: Props) {
  const filledCount = FIELDS.filter(f => {
    const v = profile[f.key]
    return v !== undefined && v !== null && v !== '' && v !== 0
  }).length
  const total = FIELDS.length
  const pct = Math.round((filledCount / total) * 100)

  const r = 26
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - filledCount / total)
  const ringColor = pct >= 75 ? '#10b981' : pct >= 40 ? '#6366f1' : '#f59e0b'

  return (
    <div className="w-[248px] shrink-0 border-l border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Profile Progress
        </p>
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <svg width={60} height={60} className="-rotate-90">
              <circle
                cx={30} cy={30} r={r}
                fill="none" strokeWidth={5}
                className="stroke-gray-200 dark:stroke-gray-700"
              />
              <circle
                cx={30} cy={30} r={r}
                fill="none" strokeWidth={5}
                stroke={ringColor}
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center rotate-90">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{pct}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {filledCount} <span className="text-gray-400 dark:text-gray-500 font-normal">/ {total}</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {pct < 40 ? 'Needs more info' : pct < 70 ? 'Good progress' : pct < 100 ? 'Nearly complete' : 'Complete!'}
            </p>
          </div>
        </div>
      </div>

      {/* Field list */}
      <div className="flex-1 overflow-y-auto py-2">
        {FIELDS.map(({ key, label, icon: Icon, format }) => {
          const value = profile[key]
          const source = profile.sources?.[key]
          const filled = value !== undefined && value !== null && value !== '' && value !== 0

          return (
            <div
              key={key}
              className={`flex items-start gap-2 px-3 py-2 mx-2 rounded-lg ${
                filled
                  ? 'bg-white dark:bg-gray-800 shadow-sm mb-1'
                  : 'opacity-40 mb-0.5'
              }`}
            >
              <div className={`mt-0.5 shrink-0 ${filled ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-300 dark:text-gray-600'}`}>
                <Icon size={12} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  {label}
                </p>
                <p className={`text-xs truncate ${filled ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-300 dark:text-gray-600'}`}>
                  {filled ? format(value) : '—'}
                </p>
              </div>
              {source && (
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${
                  source === 'form'
                    ? 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
                }`}>
                  {source}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
