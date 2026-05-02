import { useState } from 'react'
import { Search, Bot, Loader2 } from 'lucide-react'
import { queryApi } from '../../services/api'
import type { Customer } from '../../types'

const examples = [
  'Show high budget buyers in Sydney',
  'Who is most likely to convert?',
  'Active buyers looking for houses',
  'Buyers using Gemini AI',
]

interface Props {
  onResults: (customers: Customer[]) => void
}

export default function AIQueryPanel({ onResults }: Props) {
  const [query, setQuery] = useState('')
  const [insights, setInsights] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleQuery(q: string) {
    if (!q.trim()) return
    setQuery(q)
    setIsLoading(true)
    try {
      const result = await queryApi.query(q)
      setInsights(result.insights)
      onResults(result.customers)
    } catch {
      setInsights('Query failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <Bot size={15} className="text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI Query</h3>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus-within:border-indigo-300 dark:focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-50 dark:focus-within:ring-indigo-900/30 transition-all">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQuery(query)}
            placeholder="Ask AI about your CRM..."
            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
          />
        </div>
        <button
          onClick={() => handleQuery(query)}
          disabled={isLoading || !query.trim()}
          className="px-3 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2">
        {examples.map(ex => (
          <button
            key={ex}
            onClick={() => handleQuery(ex)}
            className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>

      {insights && (
        <div className="mt-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
          <p className="text-xs text-indigo-700 dark:text-indigo-400">{insights}</p>
        </div>
      )}
    </div>
  )
}
