import type { ConversationMessage } from '../../types'
import { Bot, User } from 'lucide-react'

interface Props {
  message: ConversationMessage
}

export default function ChatMessage({ message }: Props) {
  const isAI = message.role === 'assistant'
  const time = new Date(message.timestamp).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isAI
          ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
          : 'bg-gradient-to-br from-gray-400 to-gray-500'
      }`}>
        {isAI ? <Bot size={14} className="text-white" /> : <User size={14} className="text-white" />}
      </div>

      <div className={`flex flex-col gap-1 max-w-[75%] ${isAI ? '' : 'items-end'}`}>
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isAI
            ? 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
            : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-tr-sm'
        }`}>
          {message.content}
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 px-1">{time}</span>
      </div>
    </div>
  )
}
