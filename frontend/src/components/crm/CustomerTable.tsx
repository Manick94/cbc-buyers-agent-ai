import { MapPin, DollarSign, Star, ChevronRight } from 'lucide-react'
import type { Customer } from '../../types'

interface Props {
  customers: Customer[]
  selectedId?: string
  onSelect: (customer: Customer) => void
}

const statusStyles: Record<string, string> = {
  active: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  qualified: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  converted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  lost: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

function formatBudget(budget?: number): string {
  if (!budget) return '—'
  if (budget >= 1000000) return `$${(budget / 1000000).toFixed(1)}M`
  return `$${(budget / 1000).toFixed(0)}K`
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

export default function CustomerTable({ customers, selectedId, onSelect }: Props) {
  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-500">
        <p className="text-sm">No customers found</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
          <tr className="border-b border-gray-100 dark:border-gray-800">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Name</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Budget</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Location</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Score</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Last Active</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {customers.map(customer => (
            <tr
              key={customer.customer_id}
              onClick={() => onSelect(customer)}
              className={`border-b border-gray-50 dark:border-gray-800 cursor-pointer transition-colors ${
                selectedId === customer.customer_id
                  ? 'bg-indigo-50 dark:bg-indigo-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
              }`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {customer.name.charAt(0)}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{customer.name}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <DollarSign size={12} className="text-emerald-500" />
                  {formatBudget(customer.budget)}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <MapPin size={12} className="text-blue-400" />
                  {customer.location ?? '—'}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[customer.status ?? 'active']}`}>
                  {customer.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <Star size={11} className="text-amber-400" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{customer.ai_score ?? '—'}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs">{formatDate(customer.updated_at)}</td>
              <td className="px-4 py-3">
                <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
