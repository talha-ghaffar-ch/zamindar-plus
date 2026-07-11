import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ArrowLeft, KeyRound, MailCheck} from 'lucide-react-native';
import {Screen} from '../../components/Screen';
import {AppText} from '../../components/AppText';
import {Button} from '../../components/Button';
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

  const onSubmit = async () => {
    if (!/\S+@\S+\.\S+/.test(email)) {
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
    <Screen scroll dismissKeyboardOnTap>
      <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
        <ArrowLeft color={theme.colors.textSecondary} size={22} />
      </Pressable>

      <View style={styles.icon}>
        {sent ? (
          <MailCheck color={theme.colors.primaryBright} size={30} />
        ) : (
          <KeyRound color={theme.colors.primaryBright} size={30} />
        )}
      </View>

      <AppText variant="h1" style={styles.heading}>
        {sent ? 'Check your inbox' : 'Reset password'}
      </AppText>
      <AppText variant="body" color={theme.colors.textSecondary} style={styles.sub}>
        {sent
          ? `If an account exists for ${email.trim()}, a reset link is on its way.`
          : 'Enter your email and we will send you a link to reset your password.'}
      </AppText>

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
            style={styles.gapBtn}
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
            onChangeText={setEmail}
          />
          {error ? (
            <AppText variant="small" color={theme.colors.danger} style={styles.error}>
              {error}
            </AppText>
          ) : null}
          <Button
            title="Send reset link"
            onPress={onSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submit}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {marginTop: theme.spacing.sm, marginBottom: theme.spacing.xl},
  icon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  heading: {marginBottom: theme.spacing.sm},
  sub: {marginBottom: theme.spacing.xl},
  error: {marginTop: theme.spacing.md},
  submit: {marginTop: theme.spacing.xl},
  gapBtn: {marginTop: theme.spacing.sm},
});
