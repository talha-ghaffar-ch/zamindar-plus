import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { sendAiChatMessage } from '../lib/api';

type ChatMessage = {
  id: number;
  role: 'assistant' | 'user';
  text: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: 'assistant',
    text: 'Assalam o alaikum. I am Zamindar AI. Ask me about your profiles, zameen, crops, expenses, income, reports, or farm ledger workflow.',
  },
];

export function ZamindarAiPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
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
          id: Date.now() + 1,
          role: 'assistant',
          text: response.reply,
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

  return (
    <section className="ai-chat-screen">
      <div className="ai-chat-header">
        <div className="ai-chat-orb" aria-hidden="true">
          <Bot size={30} />
        </div>
        <div>
          <p className="eyebrow">Zamindar AI</p>
          <h1>Farm ledger assistant</h1>
          <p>
            Ask project-related questions only: records, zameen, crops, expenses,
            income, reports, and farm workflow.
          </p>
        </div>
        <span className="ai-live-badge">
          <Sparkles size={14} aria-hidden="true" />
          Live assistant
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
              <p>{message.text}</p>
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

        <form className="ai-chat-form" onSubmit={handleSubmit}>
          <input
            maxLength={1200}
            placeholder="Ask Zamindar AI about your farm ledger..."
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
