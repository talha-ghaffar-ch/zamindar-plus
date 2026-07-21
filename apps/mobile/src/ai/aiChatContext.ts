import {createContext} from 'react';

export type AiActionEntity =
  | 'profile'
  | 'zameen'
  | 'crop'
  | 'expense'
  | 'income';

export type AiAction = {
  type: 'created' | 'updated' | 'deleted';
  entity: AiActionEntity;
  id: string;
  label: string;
};

export type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  actions?: AiAction[];
};

export type AiChatContextValue = {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id'>) => void;
  clearMessages: () => void;
};

export const AiChatContext = createContext<AiChatContextValue | null>(null);
