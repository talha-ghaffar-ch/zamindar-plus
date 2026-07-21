import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Eraser, Send, Sparkles} from 'lucide-react-native';
import {AppText} from '../components/AppText';
import {FormattedMessage} from '../ai/FormattedMessage';
import {useAiChat} from '../ai/useAiChat';
import type {AiAction} from '../ai/aiChatContext';
import {useI18n} from '../i18n/useT';
import {theme} from '../theme';
import {haptics} from '../haptics';
import * as api from '../api';

/** Where the "Check" button on an action chip should take the user. */
const ENTITY_TAB: Record<AiAction['entity'], string> = {
  profile: 'Records',
  zameen: 'Records',
  crop: 'Records',
  expense: 'Records',
  income: 'Records',
};

export function AiScreen() {
  const {t, locale} = useI18n();
  const {messages, addMessage, clearMessages} = useAiChat();
  const navigation = useNavigation<{navigate: (name: string) => void}>();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const sendingRef = useRef(false);

  const suggestions = useMemo(
    () => [
      t('ai.suggestion1'),
      t('ai.suggestion2'),
      t('ai.suggestion3'),
      t('ai.suggestion4'),
    ],
    [t],
  );

  const scrollToEnd = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 50);
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || sendingRef.current) {
        return;
      }

      haptics.light();
      // History is captured before the new turn is appended.
      const history = messages
        .slice(-8)
        .map(m => ({role: m.role, text: m.text}));

      addMessage({role: 'user', text});
      setInput('');
      setError('');
      sendingRef.current = true;
      setSending(true);
      scrollToEnd();

      try {
        const response = await api.sendAiMessage(text, history, locale);

        if (response.errorCode === 'RATE_LIMITED') {
          setError(t('ai.rateLimited'));
        } else if (response.errorCode === 'UNAVAILABLE') {
          setError(t('ai.unavailable'));
        }

        // A failed turn still reports records that were already saved.
        if (response.errorCode && !response.actions?.length) {
          return;
        }

        addMessage({
          role: 'assistant',
          text: response.reply,
          actions: response.actions,
        });
      } catch (e) {
        setError((e as Error).message || t('ai.couldNotRespond'));
      } finally {
        sendingRef.current = false;
        setSending(false);
        scrollToEnd();
      }
    },
    [addMessage, locale, messages, scrollToEnd, t],
  );

  const handleClear = useCallback(() => {
    haptics.light();
    clearMessages();
    setError('');
  }, [clearMessages]);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Sparkles color={theme.colors.accent} size={18} />
        </View>
        <AppText variant="h2" style={styles.headerTitle}>
          {t('ai.eyebrow')}
        </AppText>
        {messages.length > 0 ? (
          <Pressable onPress={handleClear} style={styles.clearBtn}>
            <Eraser color={theme.colors.textSecondary} size={14} />
            <AppText variant="caption" color={theme.colors.textSecondary}>
              {t('ai.clearChat')}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorBar}>
          <AppText variant="caption" color={theme.colors.danger}>
            {error}
          </AppText>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToEnd}>
          {/* The greeting is derived from the active language, never stored. */}
          <Bubble role="assistant" text={t('ai.greeting')} />

          {messages.map(m => (
            <Bubble
              key={m.id}
              role={m.role}
              text={m.text}
              actions={m.actions}
              checkLabel={t('ai.check')}
              onCheck={entity => navigation.navigate(ENTITY_TAB[entity])}
            />
          ))}

          {sending ? <Bubble role="assistant" text={t('ai.thinking')} /> : null}

          {messages.length === 0 ? (
            <View style={styles.suggestions}>
              {suggestions.map(s => (
                <Pressable
                  key={s}
                  disabled={sending}
                  onPress={() => { send(s); }}
                  style={styles.suggestionChip}>
                  <AppText variant="caption" color={theme.colors.text}>
                    {s}
                  </AppText>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={t('ai.placeholder')}
            placeholderTextColor={theme.colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            selectionColor={theme.colors.primaryBright}
            onSubmitEditing={() => { send(input); }}
          />
          <Pressable
            onPress={() => { send(input); }}
            disabled={!input.trim() || sending}
            style={[
              styles.sendBtn,
              (!input.trim() || sending) && styles.sendDisabled,
            ]}>
            <Send color={theme.colors.onPrimary} size={18} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({
  role,
  text,
  actions,
  checkLabel,
  onCheck,
}: {
  role: 'user' | 'assistant';
  text: string;
  actions?: AiAction[];
  checkLabel?: string;
  onCheck?: (entity: AiAction['entity']) => void;
}) {
  const isUser = role === 'user';

  return (
    <View style={styles.bubbleWrap}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {isUser ? (
          <AppText variant="body" color={theme.colors.onPrimary}>
            {text}
          </AppText>
        ) : (
          <FormattedMessage text={text} color={theme.colors.text} />
        )}

        {actions && actions.length > 0 ? (
          <View style={styles.actions}>
            {actions.map(action => (
              <View
                key={`${action.entity}-${action.id}-${action.type}`}
                style={styles.actionChip}>
                <View
                  style={[
                    styles.actionDot,
                    action.type === 'deleted' && styles.actionDotDeleted,
                    action.type === 'updated' && styles.actionDotUpdated,
                  ]}
                />
                <AppText
                  variant="caption"
                  color={theme.colors.text}
                  style={styles.actionLabel}>
                  {action.label}
                </AppText>
                {action.type !== 'deleted' && onCheck ? (
                  <Pressable
                    onPress={() => onCheck(action.entity)}
                    style={styles.checkBtn}>
                    <AppText variant="caption" color={theme.colors.primary}>
                      {checkLabel}
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: theme.colors.background},
  flex: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: {flex: 1},
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  errorBar: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  messages: {padding: theme.spacing.xl, gap: theme.spacing.md},
  bubbleWrap: {width: '100%'},
  bubble: {
    maxWidth: '86%',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: 6,
  },
  actions: {gap: 6},
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  actionDotUpdated: {backgroundColor: theme.colors.accent},
  actionDotDeleted: {backgroundColor: theme.colors.danger},
  actionLabel: {flex: 1},
  checkBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  suggestions: {gap: theme.spacing.sm, marginTop: theme.spacing.sm},
  suggestionChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    maxHeight: 120,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {opacity: 0.5},
});
