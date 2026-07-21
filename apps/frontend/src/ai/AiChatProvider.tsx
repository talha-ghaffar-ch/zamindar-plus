import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AiChatContext,
  type AiChatContextValue,
  type ChatMessage,
} from './aiChatContext';

const STORAGE_KEY = 'zamindar-plus-ai-chat';

/**
 * The conversation lives above the router-ish page switch so it survives
 * navigating away from the AI screen, and is mirrored into sessionStorage so it
 * also survives a reload — for as long as the browser tab stays open.
 */
function readStoredMessages(): ChatMessage[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is ChatMessage =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as ChatMessage).text === 'string' &&
        ((item as ChatMessage).role === 'user' ||
          (item as ChatMessage).role === 'assistant'),
    );
  } catch {
    return [];
  }
}

function writeStoredMessages(messages: ChatMessage[]) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // Storage can be full or blocked; the in-memory conversation still works.
  }
}

export function AiChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>(readStoredMessages);
  const nextIdRef = useRef(
    readStoredMessages().reduce((max, item) => Math.max(max, item.id ?? 0), 0) +
      1,
  );

  const addMessage = useCallback((message: Omit<ChatMessage, 'id'>) => {
    const id = nextIdRef.current++;
    setMessages((current) => {
      const next = [...current, { ...message, id }];
      writeStoredMessages(next);
      return next;
    });
    return id;
  }, []);

  const clearMessages = useCallback(() => {
    setMessages(() => {
      writeStoredMessages([]);
      return [];
    });
  }, []);

  const value = useMemo<AiChatContextValue>(
    () => ({ messages, addMessage, clearMessages }),
    [messages, addMessage, clearMessages],
  );

  return (
    <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>
  );
}
