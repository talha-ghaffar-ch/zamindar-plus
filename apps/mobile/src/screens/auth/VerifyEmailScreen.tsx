import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ArrowLeft, MailCheck, ShieldCheck} from 'lucide-react-native';
import {Screen} from '../../components/Screen';
import {AppText} from '../../components/AppText';
import {Button} from '../../components/Button';
import {Input} from '../../components/Input';
import {theme} from '../../theme';
import {haptics} from '../../haptics';
import * as api from '../../api';
import type {AuthStackParamList} from '../../navigation/types';

export function VerifyEmailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const {params} = useRoute<RouteProp<AuthStackParamList, 'VerifyEmail'>>();
  const email = params?.email;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onVerify = async () => {
    if (code.trim().length < 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.verifyEmail(code.trim());
      haptics.success();
      setDone(true);
    } catch (e) {
      haptics.error();
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Screen scroll>
        <View style={styles.center}>
          <View style={styles.icon}>
            <MailCheck color={theme.colors.primaryBright} size={32} />
          </View>
          <AppText variant="h1" center style={styles.title}>
            Email verified
          </AppText>
          <AppText variant="body" color={theme.colors.textSecondary} center>
            Your account is verified. You can sign in now.
          </AppText>
          <Button
            title="Go to sign in"
            onPress={() => navigation.navigate('Login')}
            style={styles.cta}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll dismissKeyboardOnTap>
      <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
        <ArrowLeft color={theme.colors.textSecondary} size={22} />
      </Pressable>

      <View style={styles.icon}>
        <ShieldCheck color={theme.colors.primaryBright} size={30} />
      </View>
      <AppText variant="h1" style={styles.heading}>
        Verify your email
      </AppText>
      <AppText variant="body" color={theme.colors.textSecondary} style={styles.sub}>
        Enter the 6-digit code we emailed{email ? ` to ${email}` : ''}.
      </AppText>

      <Input
        label="Verification code"
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />
      {error ? (
        <AppText variant="small" color={theme.colors.danger} style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <Button
        title="Verify"
        onPress={onVerify}
        loading={loading}
        disabled={loading}
        style={styles.submit}
      />

      {email ? (
        <Pressable
          onPress={async () => {
            try {
              await api.resendVerification(email);
              haptics.success();
            } catch {
              // stays quiet; user can retry
            }
          }}
          hitSlop={8}
          style={styles.resend}>
          <AppText variant="small" color={theme.colors.primaryBright}>
            Resend code
          </AppText>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {marginTop: theme.spacing.sm, marginBottom: theme.spacing.xl},
  center: {alignItems: 'center', marginTop: theme.spacing.huge},
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
  title: {marginBottom: theme.spacing.md},
  sub: {marginBottom: theme.spacing.xl},
  error: {marginTop: theme.spacing.md},
  submit: {marginTop: theme.spacing.xl},
  resend: {marginTop: theme.spacing.lg, alignSelf: 'center'},
  cta: {marginTop: theme.spacing.xxl},
});
