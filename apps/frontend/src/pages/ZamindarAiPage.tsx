import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { type AiAction, sendAiChatMessage } from '../lib/api';

type ChatMessage = {
  id: number;
  role: 'assistant' | 'user';
  text: string;
  actions?: AiAction[];
};

type ZamindarAiPageProps = {
  onNavigate: (page: string) => void;
};

const ENTITY_PAGE: Record<AiAction['entity'], string> = {
  profile: 'Profiles',
  zameen: 'Zameen',
  crop: 'Crops',
  expense: 'Expenses',
  income: 'Income',
};

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: 'assistant',
    text: 'Assalam o alaikum. Main Zamindar AI hoon. Apni zaban mein bataiye kya karna hai — koi zameen, fasal, kharcha ya aamdan add karni ho, ya apne records ke baare mein poochna ho. Main seedha aap ke liye kaam kar dunga.',
  },
];

const SUGGESTIONS = [
  'Chak 45 ke naam se naya profile banao',
  'Is profile mein 5 acre zameen "Wheat Field" add karo',
  'Wheat fasal par 20 hazar ka fertilizer kharcha likho',
  'Is saal ka profit kitna hai?',
];

export function ZamindarAiPage({ onNavigate }: ZamindarAiPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(initialMessages.length + 1);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(rawMessage: string) {
    const trimmedMessage = rawMessage.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: nextIdRef.current++,
      role: 'user',
      text: trimmedMessage,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setMessageText('');
    setError('');
    setIsSending(true);

    try {
      const response = await sendAiChatMessage(
        trimmedMessage,
        messages.slice(-8).map((message) => ({
          role: message.role,
          text: message.text,
        })),
      );
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: nextIdRef.current++,
          role: 'assistant',
          text: response.reply,
          actions: response.actions,
        },
      ]);
    } catch (chatError) {
      setError(
        chatError instanceof Error
          ? chatError.message
          : 'Zamindar AI could not respond.',
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(messageText);
  }

  return (
    <section className="ai-chat-screen">
      <div className="ai-chat-header">
        <div className="ai-chat-orb" aria-hidden="true">
          <Bot size={30} />
        </div>
        <div>
          <p className="eyebrow">Zamindar AI</p>
          <h1>Your farm ledger agent</h1>
          <p>
            Bataiye apni zaban mein — zameen, fasal, kharcha, aamdan add karwao,
            update karwao ya apne records aur profit ke baare mein poochho. Main
            seedha kaam kar deta hoon.
          </p>
        </div>
        <span className="ai-live-badge">
          <Sparkles size={14} aria-hidden="true" />
          Live agent
        </span>
      </div>

      {error ? <p className="error ai-chat-error">{error}</p> : null}

      <div className="ai-chat-panel">
        <div className="ai-message-list">
          {messages.map((message) => (
            <article
              className={
                message.role === 'user'
                  ? 'ai-message ai-message-user'
                  : 'ai-message ai-message-assistant'
              }
              key={message.id}
            >
              {message.role === 'assistant' ? (
                <div className="ai-message-icon" aria-hidden="true">
                  <Bot size={17} />
                </div>
              ) : null}
              <div className="ai-message-body">
                <p>{message.text}</p>
                {message.actions && message.actions.length > 0 ? (
                  <div className="ai-action-list">
                    {message.actions.map((action) => (
                      <div
                        className="ai-action-chip"
                        key={`${action.entity}-${action.id}-${action.type}`}
                      >
                        <span
                          className={`ai-action-dot ai-action-${action.type}`}
                          aria-hidden="true"
                        />
                        <span className="ai-action-label">{action.label}</span>
                        {action.type !== 'deleted' ? (
                          <button
                            className="ai-action-check"
                            onClick={() => onNavigate(ENTITY_PAGE[action.entity])}
                            type="button"
                          >
                            Check
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}

          {isSending ? (
            <article className="ai-message ai-message-assistant">
              <div className="ai-message-icon" aria-hidden="true">
                <Bot size={17} />
              </div>
              <p className="ai-typing">Thinking...</p>
            </article>
          ) : null}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 ? (
          <div className="ai-suggestion-row">
            {SUGGESTIONS.map((suggestion) => (
              <button
                className="ai-suggestion-chip"
                disabled={isSending}
                key={suggestion}
                onClick={() => void sendMessage(suggestion)}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        <form className="ai-chat-form" onSubmit={handleSubmit}>
          <input
            maxLength={1200}
            placeholder="Zamindar AI ko bataiye kya karna hai..."
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
          />
          <button
            aria-label="Send message"
            className="primary-button"
            disabled={isSending || messageText.trim().length < 2}
            type="submit"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </form>
      </div>
    </section>
  );
}
