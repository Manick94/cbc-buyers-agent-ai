import { useState, useRef, type KeyboardEvent } from 'react'
import { Send, Mic, MicOff, Paperclip } from 'lucide-react'

interface Props {
  onSend: (message: string) => void
  onVoiceToggle: () => void
  isVoiceActive: boolean
  disabled?: boolean
}

export default function ChatInput({ onSend, onVoiceToggle, isVoiceActive, disabled }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput() {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }
  }

  return (
    <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shrink-0">
      <div className="flex items-end gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-3 border border-gray-200 dark:border-gray-700 focus-within:border-indigo-300 dark:focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-50 dark:focus-within:ring-indigo-900/30 transition-all">
        <button
          onClick={() => {}}
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-0.5"
          title="Attach file"
        >
          <Paperclip size={18} />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Share what the customer said, or ask the AI..."
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 resize-none outline-none min-h-[24px] max-h-[120px] leading-relaxed"
        />

        <div className="flex items-center gap-2 mb-0.5">
          <button
            onClick={onVoiceToggle}
            className={`p-1.5 rounded-lg transition-all ${
              isVoiceActive
                ? 'bg-red-50 dark:bg-red-900/20 text-red-500 animate-pulse'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={isVoiceActive ? 'Stop recording' : 'Start voice input'}
          >
            {isVoiceActive ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className="p-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5 text-center">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}
