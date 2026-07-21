import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n/useT';
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

export function ZamindarAiPage({ onNavigate }: ZamindarAiPageProps) {
  const { t, locale, dir } = useI18n();
  // The greeting is derived from the active language and rendered as a fixed
  // first bubble, so it is never stored in state and always stays localized.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(1);

  const suggestions = useMemo(
    () => [
      t('ai.suggestion1'),
      t('ai.suggestion2'),
      t('ai.suggestion3'),
      t('ai.suggestion4'),
    ],
    [t],
  );

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
        locale,
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
          : t('ai.couldNotRespond'),
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
          <p className="eyebrow">{t('ai.eyebrow')}</p>
          <h1>{t('ai.title')}</h1>
          <p>{t('ai.subtitle')}</p>
        </div>
        <span className="ai-live-badge">
          <Sparkles size={14} aria-hidden="true" />
          {t('ai.badge')}
        </span>
      </div>

      {error ? <p className="error ai-chat-error">{error}</p> : null}

      <div className="ai-chat-panel">
        <div className="ai-message-list">
          <article className="ai-message ai-message-assistant">
            <div className="ai-message-icon" aria-hidden="true">
              <Bot size={17} />
            </div>
            <div className="ai-message-body">
              <p>{t('ai.greeting')}</p>
            </div>
          </article>

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
                            {t('ai.check')}
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
              <p className="ai-typing">{t('ai.thinking')}</p>
            </article>
          ) : null}
          <div ref={endRef} />
        </div>

        {messages.length === 0 ? (
          <div className="ai-suggestion-row">
            {suggestions.map((suggestion) => (
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
            dir={dir}
            maxLength={1200}
            placeholder={t('ai.placeholder')}
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
          />
          <button
            aria-label={t('ai.sendMessage')}
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
