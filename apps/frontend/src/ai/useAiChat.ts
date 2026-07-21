import { useContext } from 'react';
import { AiChatContext, type AiChatContextValue } from './aiChatContext';

/** Access the session-scoped Zamindar AI conversation. */
export function useAiChat(): AiChatContextValue {
  const context = useContext(AiChatContext);
  if (!context) {
    throw new Error('useAiChat must be used within an AiChatProvider');
  }
  return context;
}
