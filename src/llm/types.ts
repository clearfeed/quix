export type LLMContext = {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export enum SupportedChatModels {
  OPENAI = 'openai',
  GEMINI = 'gemini',
}
