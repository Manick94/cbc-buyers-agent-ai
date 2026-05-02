export interface LLMMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface LLMRequest {
  messages: LLMMessage[]
  temperature?: number
  maxTokens?: number
}

export interface LLMResponse {
  content: string
  provider: string
}
