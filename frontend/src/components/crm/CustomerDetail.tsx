import { X, MapPin, DollarSign, Home, Calendar, Star, MessageSquare, Bot } from 'lucide-react'
import type { Customer } from '../../types'

interface Props {
  customer: Customer
  onClose: () => void
}

const statusStyles: Record<string, string> = {
  active: 'bg-blue-50 text-blue-700',
  qualified: 'bg-indigo-50 text-indigo-700',
  converted: 'bg-emerald-50 text-emerald-700',
  lost: 'bg-red-50 text-red-700',
}

function formatBudget(budget?: number): string {
  if (!budget) return '—'
  if (budget >= 1000000) return `$${(budget / 1000000).toFixed(2)}M`
  return `$${(budget / 1000).toFixed(0)}K`
}

function getAIInsights(customer: Customer): string[] {
  const insights: string[] = []
  if ((customer.ai_score ?? 0) >= 80) insights.push('High intent buyer')
  if ((customer.ai_score ?? 0) >= 75) insights.push('Likely to convert within 30 days')
  if (customer.status === 'qualified') insights.push('Finance pre-approval likely')
  if (customer.preferences?.intent === 'investment') insights.push('Investment-focused buyer')
  if ((customer.budget ?? 0) >= 1000000) insights.push('Premium property segment')
  if (insights.length === 0) insights.push('Continue engagement to build profile')
  return insights
}

export default function CustomerDetail({ customer, onClose }: Props) {
  const prefs = customer.preferences
  const conversation = customer.conversation ?? []
  const insights = getAIInsights(customer)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-semibold">
            {customer.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{customer.name}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[customer.status ?? 'active']}`}>
              {customer.status}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Profile</h4>
          {[
            { icon: DollarSign, color: 'text-emerald-500', label: 'Budget', value: formatBudget(customer.budget) },
            { icon: MapPin, color: 'text-blue-500', label: 'Location', value: customer.location },
            { icon: Home, color: 'text-violet-500', label: 'Property', value: prefs?.propertyType ? `${prefs.propertyType}${prefs.bedrooms ? `, ${prefs.bedrooms}BR` : ''}` : undefined },
            { icon: Calendar, color: 'text-amber-500', label: 'Intent', value: prefs?.intent },
            { icon: Star, color: 'text-amber-400', label: 'AI Score', value: customer.ai_score?.toString() },
          ].filter(item => item.value).map(({ icon: Icon, color, label, value }) => (
            <div key={label} className="flex items-center gap-2 text-xs">
              <Icon size={13} className={color} />
              <span className="text-gray-500">{label}:</span>
              <span className="font-medium text-gray-800 capitalize">{value}</span>
            </div>
          ))}
        </div>

        {prefs?.features && prefs.features.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Desired Features</h4>
            <div className="flex flex-wrap gap-1">
              {prefs.features.map(f => (
                <span key={f} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs">{f}</span>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Bot size={13} className="text-indigo-500" />
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">AI Insights</h4>
          </div>
          <div className="space-y-1.5">
            {insights.map(insight => (
              <div key={insight} className="flex items-start gap-2 bg-indigo-50 rounded-lg px-3 py-2">
                <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <p className="text-xs text-indigo-800">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {conversation.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <MessageSquare size={13} className="text-gray-400" />
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Interactions</h4>
            </div>
            <div className="space-y-2">
              {conversation.slice(-4).map((msg, i) => (
                <div key={i} className={`text-xs p-2 rounded-lg ${msg.role === 'assistant' ? 'bg-gray-50 text-gray-600' : 'bg-indigo-50 text-indigo-800'}`}>
                  <span className="font-medium capitalize">{msg.role}:</span> {msg.content.substring(0, 120)}{msg.content.length > 120 ? '…' : ''}
                </div>
              ))}
            </div>
          </div>
        )}

        {customer.notes && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</h4>
            <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{customer.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
