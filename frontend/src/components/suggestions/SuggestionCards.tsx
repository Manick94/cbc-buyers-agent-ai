import { Sparkles, RefreshCw } from 'lucide-react'

interface Props {
  suggestions: string[]
  onSelect: (question: string) => void
  onRefresh: () => void
  isLoading?: boolean
}

const categoryColors: Record<string, string> = {
  budget: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  location: 'bg-blue-50 text-blue-700 border-blue-100',
  property: 'bg-violet-50 text-violet-700 border-violet-100',
  timeline: 'bg-amber-50 text-amber-700 border-amber-100',
  general: 'bg-indigo-50 text-indigo-700 border-indigo-100',
}

export default function SuggestionCards({ suggestions, onSelect, onRefresh, isLoading }: Props) {
  return (
    <div className="bg-white/70 backdrop-blur rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-700">Smart Suggestions</h3>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all disabled:opacity-40"
          title="Refresh suggestions"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 bg-gray-100 rounded-xl animate-pulse" />
          ))
        ) : suggestions.length > 0 ? (
          suggestions.map((question, i) => (
            <button
              key={i}
              onClick={() => onSelect(question)}
              className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-medium transition-all hover:shadow-sm active:scale-[0.98] ${
                categoryColors['general']
              } hover:bg-indigo-100`}
            >
              {question}
            </button>
          ))
        ) : (
          <p className="text-xs text-gray-400 text-center py-3">Start a conversation to get suggestions</p>
        )}
      </div>
    </div>
  )
}
