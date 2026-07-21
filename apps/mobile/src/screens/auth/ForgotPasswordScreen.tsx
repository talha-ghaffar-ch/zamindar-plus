import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {KeyRound, Mail, MailCheck} from 'lucide-react-native';
import {AuthScaffold} from '../../components/AuthScaffold';
import {AppText} from '../../components/AppText';
import {Button} from '../../components/Button';
import {AuthSubmitButton} from '../../components/AuthSubmitButton';
import {Input} from '../../components/Input';
import {useI18n} from '../../i18n/useT';
import {theme} from '../../theme';
import {haptics} from '../../haptics';
import * as api from '../../api';
import type {AuthStackParamList} from '../../navigation/types';

export function ForgotPasswordScreen() {
  const {t} = useI18n();
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const ready = /\S+@\S+\.\S+/.test(email);

  const onSubmit = async () => {
    if (!ready) {
      setError(t('mobile.invalidEmailShort'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.forgotPassword(email.trim());
      haptics.success();
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      eyebrow={t('mobile.passwordHelp')}
      title={sent ? t('mobile.checkInbox') : t('auth.resetPassword')}
      subtitle={
        sent
          ? `If an account exists for ${email.trim()}, a reset code is on its way.`
          : t('mobile.forgotIntro')
      }
      onBack={() => navigation.goBack()}>
      <View style={styles.icon}>
        {sent ? (
          <MailCheck color={theme.colors.primaryBright} size={30} />
        ) : (
          <KeyRound color={theme.colors.primaryBright} size={30} />
        )}
      </View>

      {sent ? (
        <>
          <Button
            title={t('mobile.enterResetCode')}
            onPress={() =>
              navigation.navigate('ResetPassword', {email: email.trim()})
            }
          />
          <Button
            title={t('auth.backToSignIn')}
            variant="ghost"
            onPress={() => navigation.navigate('Login')}
            style={styles.gap}
          />
        </>
      ) : (
        <>
          <Input
            label={t('auth.email')}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={value => {
              setEmail(value);
              setError(null);
            }}
            leftIcon={<Mail color={theme.colors.textMuted} size={18} />}
          />
          {error ? (
            <AppText
              variant="small"
              color={theme.colors.danger}
              style={styles.error}>
              {error}
            </AppText>
          ) : null}
          <AuthSubmitButton
            title={loading ? 'Sending…' : t('auth.sendResetCode')}
            onPress={onSubmit}
            ready={ready}
            loading={loading}
            style={styles.submit}
          />
        </>
      )}
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  gap: {marginTop: theme.spacing.sm},
  error: {marginTop: theme.spacing.md},
  submit: {marginTop: theme.spacing.lg},
});
