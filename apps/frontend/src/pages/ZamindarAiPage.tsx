import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Eraser, Mic, Send, Sparkles, Square } from 'lucide-react';
import { useI18n } from '../i18n/useT';
import { FormattedMessage } from '../ai/FormattedMessage';
import { useAiChat } from '../ai/useAiChat';
import { useSpeechInput } from '../ai/useSpeechInput';
import { type AiAction, sendAiChatMessage } from '../lib/api';

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
  const { t, locale } = useI18n();
  const { messages, addMessage, clearMessages } = useAiChat();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);

  const suggestions = useMemo(
    () => [
      t('ai.suggestion1'),
      t('ai.suggestion2'),
      t('ai.suggestion3'),
      t('ai.suggestion4'),
    ],
    [t],
  );

  const sendMessage = useCallback(
    async (rawMessage: string) => {
      const trimmedMessage = rawMessage.trim();

      if (!trimmedMessage || isSendingRef.current) {
        return;
      }

      // The history sent to the agent is captured before the new turn is added.
      const history = messages.slice(-8).map((message) => ({
        role: message.role,
        text: message.text,
      }));

      addMessage({ role: 'user', text: trimmedMessage });
      setMessageText('');
      setError('');
      isSendingRef.current = true;
      setIsSending(true);

      try {
        const response = await sendAiChatMessage(
          trimmedMessage,
          history,
          locale,
        );

        if (response.errorCode === 'RATE_LIMITED') {
          setError(t('ai.rateLimited'));
        } else if (response.errorCode === 'UNAVAILABLE') {
          setError(t('ai.unavailable'));
        }

        // A failed turn still reports any records that were already saved.
        if (response.errorCode && !response.actions?.length) {
          return;
        }

        addMessage({
          role: 'assistant',
          text: response.reply,
          actions: response.actions,
        });
      } catch (chatError) {
        setError(
          chatError instanceof Error
            ? chatError.message
            : t('ai.couldNotRespond'),
        );
      } finally {
        isSendingRef.current = false;
        setIsSending(false);
      }
    },
    [addMessage, locale, messages, t],
  );

  // Speaking a message sends it straight away, so the flow stays hands-free.
  const handleTranscript = useCallback(
    (transcript: string) => {
      void sendMessage(transcript);
    },
    [sendMessage],
  );

  const speech = useSpeechInput({ locale, onResult: handleTranscript });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, speech.interimText]);

  const voiceError = useMemo(() => {
    if (!speech.error) {
      return '';
    }
    if (speech.error === 'not-allowed' || speech.error === 'service-not-allowed') {
      return t('ai.voiceDenied');
    }
    if (speech.error === 'no-speech') {
      return t('ai.voiceNoSpeech');
    }
    return t('ai.voiceError');
  }, [speech.error, t]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(messageText);
  }

  function handleClear() {
    if (messages.length === 0) {
      return;
    }
    if (window.confirm(t('ai.clearChatConfirm'))) {
      clearMessages();
      setError('');
    }
  }

  function toggleVoice() {
    if (speech.isListening) {
      speech.stop();
    } else {
      speech.start();
    }
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
        <div className="ai-header-actions">
          <span className="ai-live-badge">
            <Sparkles size={14} aria-hidden="true" />
            {t('ai.badge')}
          </span>
          {messages.length > 0 ? (
            <button
              className="ai-clear-button"
              type="button"
              onClick={handleClear}
            >
              <Eraser size={14} aria-hidden="true" />
              {t('ai.clearChat')}
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="error ai-chat-error">{error}</p> : null}
      {voiceError ? <p className="error ai-chat-error">{voiceError}</p> : null}

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
                {message.role === 'assistant' ? (
                  <FormattedMessage text={message.text} />
                ) : (
                  <p>{message.text}</p>
                )}
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

          {speech.isListening ? (
            <article className="ai-message ai-message-user ai-message-interim">
              <div className="ai-message-body">
                <p>
                  {speech.interimText || t('ai.listening')}
                  <span className="ai-listening-dot" aria-hidden="true" />
                </p>
              </div>
            </article>
          ) : null}

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
          {speech.isSupported ? (
            <button
              aria-label={
                speech.isListening ? t('ai.stopVoice') : t('ai.startVoice')
              }
              aria-pressed={speech.isListening}
              className={
                speech.isListening
                  ? 'ai-mic-button listening'
                  : 'ai-mic-button'
              }
              disabled={isSending}
              title={speech.isListening ? t('ai.stopVoice') : t('ai.startVoice')}
              type="button"
              onClick={toggleVoice}
            >
              {speech.isListening ? (
                <Square size={16} aria-hidden="true" />
              ) : (
                <Mic size={18} aria-hidden="true" />
              )}
            </button>
          ) : null}
          <input
            maxLength={1200}
            placeholder={
              speech.isListening ? t('ai.listening') : t('ai.placeholder')
            }
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
