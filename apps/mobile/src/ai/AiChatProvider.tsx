import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AiChatContext,
  type AiChatContextValue,
  type ChatMessage,
} from './aiChatContext';

const STORAGE_KEY = 'zamindar-plus-ai-chat';

/**
 * Keeps the conversation above the navigator so it survives moving between
 * tabs and screens, and mirrors it to AsyncStorage so it also survives the app
 * being backgrounded and reopened.
 */
export function AiChatProvider({children}: {children: ReactNode}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const nextIdRef = useRef(1);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (cancelled || !raw) {
        hydratedRef.current = true;
        return;
      }
      try {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const restored = parsed.filter(
            (item): item is ChatMessage =>
              typeof item === 'object' &&
              item !== null &&
              typeof (item as ChatMessage).text === 'string',
          );
          setMessages(restored);
          nextIdRef.current = restored.length + 1;
        }
      } catch {
        // A corrupt entry just means starting a fresh conversation.
      }
      hydratedRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: ChatMessage[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
      // Storage failures should not break the conversation in memory.
    });
  }, []);

  const addMessage = useCallback(
    (message: Omit<ChatMessage, 'id'>) => {
      setMessages(current => {
        const next = [
          ...current,
          {...message, id: `m-${nextIdRef.current++}`},
        ];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const clearMessages = useCallback(() => {
    setMessages(() => {
      persist([]);
      return [];
    });
  }, [persist]);

  const value = useMemo<AiChatContextValue>(
    () => ({messages, addMessage, clearMessages}),
    [messages, addMessage, clearMessages],
  );

  return (
    <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>
  );
}
