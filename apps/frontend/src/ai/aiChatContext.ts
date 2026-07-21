import { createContext } from 'react';
import type { AiAction } from '../lib/api';

export type ChatMessage = {
  id: number;
  role: 'assistant' | 'user';
  text: string;
  actions?: AiAction[];
};

export type AiChatContextValue = {
  messages: ChatMessage[];
  /** Append a message and return the id it was stored under. */
  addMessage: (message: Omit<ChatMessage, 'id'>) => number;
  clearMessages: () => void;
};

export const AiChatContext = createContext<AiChatContextValue | null>(null);
