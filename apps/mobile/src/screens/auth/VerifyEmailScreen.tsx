import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MailCheck, ShieldCheck} from 'lucide-react-native';
import {AuthScaffold} from '../../components/AuthScaffold';
import {AppText} from '../../components/AppText';
import {Button} from '../../components/Button';
import {AuthSubmitButton} from '../../components/AuthSubmitButton';
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

  const ready = code.trim().length >= 6;

  const onVerify = async () => {
    if (!ready) {
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
      <AuthScaffold
        eyebrow="All set"
        title="Email verified"
        subtitle="Your account is verified. You can sign in now.">
        <View style={styles.icon}>
          <MailCheck color={theme.colors.primaryBright} size={32} />
        </View>
        <Button
          title="Go to sign in"
          onPress={() => navigation.navigate('Login')}
        />
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold
      eyebrow="Verify account"
      title="Verify your email"
      subtitle={`Enter the 6-digit code we emailed${email ? ` to ${email}` : ''}.`}
      onBack={() => navigation.goBack()}>
      <View style={styles.icon}>
        <ShieldCheck color={theme.colors.primaryBright} size={30} />
      </View>
      <Input
        label="Verification code"
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={t => {
          setCode(t);
          setError(null);
        }}
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
        title={loading ? 'Verifying…' : 'Verify'}
        onPress={onVerify}
        ready={ready}
        loading={loading}
        style={styles.submit}
      />
      {email ? (
        <Pressable
          onPress={async () => {
            try {
              await api.resendVerification(email);
              haptics.success();
            } catch {
              // stays quiet; the user can retry
            }
          }}
          hitSlop={8}
          style={styles.resend}>
          <AppText variant="small" color={theme.colors.primary}>
            Resend code
          </AppText>
        </Pressable>
      ) : null}
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
  error: {marginTop: theme.spacing.md},
  submit: {marginTop: theme.spacing.lg},
  resend: {marginTop: theme.spacing.lg, alignSelf: 'center'},
});
