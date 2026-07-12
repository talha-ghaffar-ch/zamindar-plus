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
import {theme} from '../../theme';
import {haptics} from '../../haptics';
import * as api from '../../api';
import type {AuthStackParamList} from '../../navigation/types';

export function ForgotPasswordScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const ready = /\S+@\S+\.\S+/.test(email);

  const onSubmit = async () => {
    if (!ready) {
      setError('Enter a valid email address.');
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
      eyebrow="Password help"
      title={sent ? 'Check your inbox' : 'Reset password'}
      subtitle={
        sent
          ? `If an account exists for ${email.trim()}, a reset code is on its way.`
          : 'Enter your email and we will send you a code to reset your password.'
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
            title="Enter reset code"
            onPress={() =>
              navigation.navigate('ResetPassword', {email: email.trim()})
            }
          />
          <Button
            title="Back to sign in"
            variant="ghost"
            onPress={() => navigation.navigate('Login')}
            style={styles.gap}
          />
        </>
      ) : (
        <>
          <Input
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={t => {
              setEmail(t);
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
            title={loading ? 'Sending…' : 'Send reset code'}
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
