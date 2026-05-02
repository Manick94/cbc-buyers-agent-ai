import { MapPin, DollarSign, Home, Calendar, Star, Tag, Edit2 } from 'lucide-react'
import type { Customer } from '../../types'

interface Props {
  customer: Partial<Customer>
  onEdit?: () => void
}

function formatBudget(budget?: number): string {
  if (!budget) return '—'
  if (budget >= 1000000) return `$${(budget / 1000000).toFixed(1)}M`
  return `$${(budget / 1000).toFixed(0)}K`
}

function ScoreBar({ score }: { score?: number }) {
  if (!score) return null
  const color = score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700">{score}</span>
    </div>
  )
}

export default function CustomerProfile({ customer, onEdit }: Props) {
  const prefs = customer.preferences

  return (
    <div className="bg-white/70 backdrop-blur rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Customer Profile</h3>
        {onEdit && (
          <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all">
            <Edit2 size={13} />
          </button>
        )}
      </div>

      {!customer.name ? (
        <p className="text-xs text-gray-400 text-center py-4">Profile will populate as you chat</p>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-base font-semibold text-gray-900">{customer.name}</p>
            {customer.ai_score !== undefined && (
              <div className="mt-1.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Star size={10} /> AI Score</span>
                </div>
                <ScoreBar score={customer.ai_score} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            {customer.budget && (
              <div className="flex items-center gap-2 text-xs">
                <DollarSign size={13} className="text-emerald-500 shrink-0" />
                <span className="text-gray-600">Budget:</span>
                <span className="font-medium text-gray-900">{formatBudget(customer.budget)}</span>
              </div>
            )}
            {customer.location && (
              <div className="flex items-center gap-2 text-xs">
                <MapPin size={13} className="text-blue-500 shrink-0" />
                <span className="text-gray-600">Location:</span>
                <span className="font-medium text-gray-900">{customer.location}</span>
              </div>
            )}
            {prefs?.propertyType && (
              <div className="flex items-center gap-2 text-xs">
                <Home size={13} className="text-violet-500 shrink-0" />
                <span className="text-gray-600">Property:</span>
                <span className="font-medium text-gray-900 capitalize">{prefs.propertyType}{prefs.bedrooms ? `, ${prefs.bedrooms}BR` : ''}</span>
              </div>
            )}
            {prefs?.intent && (
              <div className="flex items-center gap-2 text-xs">
                <Calendar size={13} className="text-amber-500 shrink-0" />
                <span className="text-gray-600">Intent:</span>
                <span className="font-medium text-gray-900 capitalize">{prefs.intent}</span>
              </div>
            )}
          </div>

          {prefs?.features && prefs.features.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
                <Tag size={10} />
                Features
              </div>
              <div className="flex flex-wrap gap-1">
                {prefs.features.map(f => (
                  <span key={f} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{f}</span>
                ))}
              </div>
            </div>
          )}

          {customer.status && (
            <div className="pt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                customer.status === 'converted' ? 'bg-emerald-50 text-emerald-700' :
                customer.status === 'qualified' ? 'bg-blue-50 text-blue-700' :
                customer.status === 'lost' ? 'bg-red-50 text-red-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {customer.status}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
