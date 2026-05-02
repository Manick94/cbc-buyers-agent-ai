import type { LLMRequest, LLMResponse } from './types'
import { callGemini } from './gemini'
import { callOpenAI } from './openai'
import { callOllama } from './ollama'
import { callLocalModel } from './local'
import { callOpenRouter } from './openrouter'
import { getDefaultSettings } from '../keyStorage'
import type { LLMProvider, ConversationMessage } from '../../types'

export async function callLLM(req: LLMRequest, provider?: LLMProvider): Promise<LLMResponse> {
  const settings = getDefaultSettings()
  const active = provider ?? settings.provider ?? 'gemini'

  switch (active) {
    case 'gemini':
      if (!settings.geminiKey) throw new Error('Gemini API key not configured. Go to Settings.')
      return callGemini(req, settings.geminiKey)
    case 'openai':
      if (!settings.openaiKey) throw new Error('OpenAI API key not configured. Go to Settings.')
      return callOpenAI(req, settings.openaiKey)
    case 'ollama':
      return callOllama(req, settings.ollamaUrl, settings.ollamaModel)
    case 'openrouter':
      if (!settings.openrouterKey) throw new Error('OpenRouter API key not configured. Go to Settings.')
      return callOpenRouter(req, settings.openrouterKey, settings.openrouterModel)
    case 'local':
      return callLocalModel(req, settings.localModelType ?? 'smollm2')
    default:
      throw new Error(`Unknown provider: ${active}`)
  }
}

const SUGGESTION_SYSTEM = `You are an AI co-pilot for an Australian property buyers agent. Based on the conversation and any captured customer info, suggest 4 focused questions the agent should ask their customer next to better qualify their needs. Return ONLY a valid JSON array of question strings, nothing else.`

export async function generateSuggestions(
  conversation: ConversationMessage[],
  profile: Record<string, unknown>
): Promise<string[]> {
  const conversationText = conversation.map(m => `${m.role}: ${m.content}`).join('\n')

  try {
    const response = await callLLM({
      messages: [
        { role: 'system', content: SUGGESTION_SYSTEM },
        { role: 'user', content: `Conversation:\n${conversationText}\n\nProfile so far: ${JSON.stringify(profile)}\n\nReturn 4 follow-up questions as a JSON array.` },
      ],
      maxTokens: 256,
    })

    const match = response.content.match(/\[[\s\S]*?\]/)
    if (match) return JSON.parse(match[0]) as string[]
  } catch { /* fall through to defaults */ }

  return [
    'What is your budget range?',
    'Which suburbs or areas interest you?',
    'Is this for investment or personal use?',
    'How soon are you looking to purchase?',
  ]
}

const PROFILE_SYSTEM = `Extract property buyer profile data from the conversation. Return ONLY valid JSON with these fields (omit missing): { name, budget (number AUD), location (suburb/city string), preferences: { propertyType ("apartment"|"house"|"townhouse"), bedrooms (number), features (string[]), intent ("investment"|"personal") } }`

export async function extractProfile(conversation: ConversationMessage[]): Promise<Record<string, unknown>> {
  try {
    const text = conversation.map(m => `${m.role}: ${m.content}`).join('\n')
    const response = await callLLM({
      messages: [
        { role: 'system', content: PROFILE_SYSTEM },
        { role: 'user', content: text },
      ],
      maxTokens: 512,
    })
    const match = response.content.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as Record<string, unknown>
  } catch { /* ignore */ }
  return {}
}

const CHAT_SYSTEM = `You are an AI co-pilot assisting an Australian property buyers agent during a live customer session. The agent shares notes about what the customer says. You help the agent by: suggesting the best follow-up questions to ask, flagging gaps in what's been captured, giving quick insights about the customer's needs, and recommending next steps. Be concise and practical — the agent is in an active session. When the agent says "customer said X" or shares notes, respond with actionable guidance.`

export async function chatReply(
  conversation: ConversationMessage[],
  userMessage: string,
  customerContext?: string
): Promise<string> {
  const systemContent = customerContext
    ? `${CHAT_SYSTEM}\n\nCurrent customer info captured:\n${customerContext}`
    : CHAT_SYSTEM

  try {
    const response = await callLLM({
      messages: [
        { role: 'system', content: systemContent },
        ...conversation.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage },
      ],
      temperature: 0.8,
      maxTokens: 512,
    })
    return response.content
  } catch (err) {
    if (err instanceof Error && err.message.includes('not configured')) {
      return `⚠️ ${err.message}`
    }
    return 'Sorry, I encountered an error. Please check your LLM settings.'
  }
}
