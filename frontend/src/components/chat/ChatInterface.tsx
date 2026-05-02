import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Bot, Sparkles, RefreshCw } from 'lucide-react'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import VoiceMode from './VoiceMode'
import CustomerIntakeForm, { type IntakeData, EMPTY_INTAKE } from './CustomerIntakeForm'
import ProfileProgress, { type MergedProfile } from '../profile/ProfileProgress'
import type { ConversationMessage } from '../../types'
import { chatReply, generateSuggestions, extractProfile } from '../../services/llm/router'
import { getDefaultSettings } from '../../services/keyStorage'

const INITIAL_SUGGESTIONS = [
  "What's their budget range?",
  "Which suburbs are they considering?",
  "Investment or planning to live in it?",
  "What's their ideal move-in timeline?",
]

const WELCOME_MESSAGE: ConversationMessage = {
  role: 'assistant',
  content: "I'm your AI co-pilot for this session. Tell me what the customer says and I'll suggest follow-up questions, flag gaps, and help you qualify their needs.",
  timestamp: new Date().toISOString(),
}

function buildContextString(d: IntakeData): string {
  if (!d.name.trim()) return ''
  const lines: string[] = [`Customer: ${d.name}`]
  if (d.budget) {
    const n = parseFloat(d.budget)
    lines.push(`Budget: $${n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : `${(n / 1000).toFixed(0)}K`}`)
  }
  if (d.location) lines.push(`Location: ${d.location}`)
  const prop = [d.propertyType, d.bedrooms ? `${d.bedrooms} BR` : ''].filter(Boolean).join(', ')
  if (prop) lines.push(`Property: ${prop}`)
  if (d.intent) lines.push(`Intent: ${d.intent === 'investment' ? 'Investment' : 'Personal use'}`)
  if (d.notes) lines.push(`Notes: ${d.notes}`)
  return lines.join('\n')
}

function buildMergedProfile(
  form: IntakeData,
  chat: Record<string, unknown>
): MergedProfile {
  const sources: Record<string, 'form' | 'chat'> = {}
  const p: MergedProfile = { sources }

  function pick<T>(key: keyof MergedProfile, formVal: T | undefined, chatVal: T | undefined) {
    if (formVal) { (p as any)[key] = formVal; sources[key] = 'form' }
    else if (chatVal) { (p as any)[key] = chatVal; sources[key] = 'chat' }
  }

  const chatPrefs = (chat.preferences as any) ?? {}

  pick('name', form.name || undefined, chat.name as string | undefined)
  pick('budget',
    form.budget ? parseFloat(form.budget) : undefined,
    chat.budget !== undefined ? Number(chat.budget) : undefined
  )
  pick('location', form.location || undefined, chat.location as string | undefined)
  pick('propertyType', form.propertyType || undefined, chatPrefs.propertyType as string | undefined)
  pick('bedrooms',
    form.bedrooms ? parseInt(form.bedrooms) : undefined,
    chatPrefs.bedrooms !== undefined ? Number(chatPrefs.bedrooms) : undefined
  )
  pick('intent', form.intent || undefined, chatPrefs.intent as string | undefined)

  const contact = form.phone || form.email
  if (contact) { p.contact = contact; sources.contact = 'form' }

  if (form.notes) { p.notes = form.notes; sources.notes = 'form' }

  return p
}

export default function ChatInterface() {
  const [intakeData, setIntakeData] = useState<IntakeData>(EMPTY_INTAKE)
  const [chatExtracted, setChatExtracted] = useState<Record<string, unknown>>({})
  const [messages, setMessages] = useState<ConversationMessage[]>([WELCOME_MESSAGE])
  const [suggestions, setSuggestions] = useState<string[]>(INITIAL_SUGGESTIONS)
  const [isTyping, setIsTyping] = useState(false)
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  const settings = getDefaultSettings()

  const customerContext = useMemo(() => buildContextString(intakeData), [intakeData])
  const mergedProfile = useMemo(() => buildMergedProfile(intakeData, chatExtracted), [intakeData, chatExtracted])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  function handleIntakeChange(field: keyof IntakeData, value: string) {
    setIntakeData(d => ({ ...d, [field]: value }))
  }

  const refreshSuggestions = useCallback(async (msgs: ConversationMessage[], ctx: string) => {
    if (msgs.length < 2) return
    setIsSuggestionsLoading(true)
    try {
      const next = await generateSuggestions(msgs, { customerContext: ctx })
      setSuggestions(next)
    } finally {
      setIsSuggestionsLoading(false)
    }
  }, [])

  async function handleSend(userMessage: string) {
    const userMsg: ConversationMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setIsTyping(true)

    try {
      const replyText = await chatReply(messages, userMessage, customerContext)
      const assistantMsg: ConversationMessage = {
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toISOString(),
      }
      const finalMessages = [...updatedMessages, assistantMsg]
      setMessages(finalMessages)

      if (finalMessages.length >= 3) {
        extractProfile(finalMessages).then(extracted => {
          if (Object.keys(extracted).length > 0) {
            setChatExtracted(prev => ({ ...prev, ...extracted }))
          }
        }).catch(() => {})
      }

      await refreshSuggestions(finalMessages, customerContext)
    } finally {
      setIsTyping(false)
    }
  }

  function toggleVoice() {
    if (isVoiceActive) {
      recognitionRef.current?.stop()
      setIsVoiceActive(false)
      setVoiceTranscript('')
      return
    }
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      alert('Voice input not supported in this browser. Try Chrome.')
      return
    }
    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-AU'
    recognitionRef.current = recognition
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript)
        .join('')
      setVoiceTranscript(transcript)
      if (event.results[event.results.length - 1].isFinal) {
        handleSend(transcript)
        setIsVoiceActive(false)
        setVoiceTranscript('')
      }
    }
    recognition.onend = () => { setIsVoiceActive(false); setVoiceTranscript('') }
    recognition.start()
    setIsVoiceActive(true)
  }

  const providerLabel: Record<string, string> = {
    gemini: 'Gemini', openai: 'GPT-4o', ollama: 'Ollama', local: 'Local',
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Panel 1: Intake form */}
      <CustomerIntakeForm
        data={intakeData}
        onChange={handleIntakeChange}
        onCustomerSaved={setCurrentCustomerId}
      />

      {/* Panel 2: AI co-pilot chat */}
      <div className="flex flex-col flex-1 min-w-0 bg-white dark:bg-gray-950">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">AI Co-pilot</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {providerLabel[settings.provider] ?? 'AI'} · {currentCustomerId ? 'Customer saved' : 'Session active'}
                </span>
              </div>
            </div>
          </div>
          {intakeData.name && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{intakeData.name}</span>
              {intakeData.budget && (
                <span className="text-xs text-indigo-400 dark:text-indigo-500">
                  · ${parseFloat(intakeData.budget) >= 1e6
                    ? `${(parseFloat(intakeData.budget) / 1e6).toFixed(1)}M`
                    : `${(parseFloat(intakeData.budget) / 1000).toFixed(0)}K`}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 relative bg-gray-50/30 dark:bg-gray-950">
          {messages.map((msg, i) => <ChatMessage key={i} message={msg} />)}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
          <VoiceMode
            isActive={isVoiceActive}
            transcript={voiceTranscript}
            onClose={() => { setIsVoiceActive(false); setVoiceTranscript('') }}
          />
        </div>

        {/* Suggestion chips */}
        <div className="px-5 py-2 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 shrink-0">
              <Sparkles size={11} className="text-indigo-400" />
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Ask:</span>
            </div>
            {isSuggestionsLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                ))
              : suggestions.slice(0, 4).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    className="px-3 py-1 bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-full text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all whitespace-nowrap"
                  >
                    {s}
                  </button>
                ))}
            <button
              onClick={() => refreshSuggestions(messages, customerContext)}
              disabled={isSuggestionsLoading}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-indigo-500 transition-all disabled:opacity-40"
            >
              <RefreshCw size={11} className={isSuggestionsLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <ChatInput
          onSend={handleSend}
          onVoiceToggle={toggleVoice}
          isVoiceActive={isVoiceActive}
          disabled={isTyping}
        />
      </div>

      {/* Panel 3: Profile progress */}
      <ProfileProgress profile={mergedProfile} />
    </div>
  )
}
