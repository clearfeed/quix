export type LLMContext = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export enum SupportedChatModels {
  OPENAI = 'openai',
  GEMINI = 'gemini'
}

export interface MessageProcessingArgs {
  message: string;
  teamId: string;
  threadTs: string;
  previousMessages: LLMContext[];
  channelId: string;
}
