// Slack Types
export interface SlackChallengeEvent {
  token: string;
  challenge: string;
  type: 'url_verification';
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  result?: T;
  error?: string;
}

export interface QueryRequest {
  message: string;
}

export type LLMContext = {
  role: 'user' | 'assistant' | 'system';
  content: string;
}