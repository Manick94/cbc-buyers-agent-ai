export interface Customer {
  customer_id: string
  name: string
  budget?: number
  location?: string
  preferences?: {
    propertyType?: string
    bedrooms?: number
    features?: string[]
    intent?: 'investment' | 'personal'
  }
  conversation?: ConversationMessage[]
  llm_source?: 'local' | 'cloud_gemini' | 'cloud_openai' | 'ollama'
  agent_id?: string
  status?: 'active' | 'qualified' | 'converted' | 'lost' | 'deleted'
  ai_score?: number
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export type LLMProvider = 'local' | 'ollama' | 'gemini' | 'openai' | 'openrouter'
export type LocalModelType = 'smollm2' | 'gemma4b'

export interface LLMSettings {
  provider: LLMProvider
  geminiKey?: string
  openaiKey?: string
  ollamaUrl?: string
  ollamaModel?: string
  openrouterKey?: string
  openrouterModel?: string
  localModelType?: LocalModelType
}

export interface SuggestionCard {
  id: string
  question: string
  category: 'budget' | 'location' | 'property' | 'timeline' | 'general'
}

export interface AnalyticsSummary {
  totalCustomers: number
  activeConversations: number
  conversionRate: number
  avgBudget: number
  avgAiScore: number
  llmUsage: Record<string, number>
  statusBreakdown: Record<string, number>
}
