import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Eye, EyeOff, KeyRound, Lock, ShieldCheck} from 'lucide-react-native';
import {AuthScaffold} from '../../components/AuthScaffold';
import {AppText} from '../../components/AppText';
import {Button} from '../../components/Button';
import {AuthSubmitButton} from '../../components/AuthSubmitButton';
import {Input} from '../../components/Input';
import {theme} from '../../theme';
import {haptics} from '../../haptics';
import * as api from '../../api';
import type {AuthStackParamList} from '../../navigation/types';

export function ResetPasswordScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const {params} = useRoute<RouteProp<AuthStackParamList, 'ResetPassword'>>();
  const email = params?.email;

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const ready = code.trim().length >= 6 && password.length >= 8;

  const onSubmit = async () => {
    if (code.trim().length < 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.resetPassword(code.trim(), password);
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
        title="Password reset"
        subtitle="Your password has been changed. Sign in with your new password.">
        <View style={styles.icon}>
          <ShieldCheck color={theme.colors.primaryBright} size={32} />
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
      eyebrow="Password help"
      title="Set a new password"
      subtitle={`Enter the 6-digit code we emailed${email ? ` to ${email}` : ''} and choose a new password.`}
      onBack={() => navigation.goBack()}>
      <View style={styles.icon}>
        <KeyRound color={theme.colors.primaryBright} size={30} />
      </View>
      <Input
        label="Reset code"
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={t => {
          setCode(t);
          setError(null);
        }}
      />
      <Input
        label="New password"
        placeholder="At least 8 characters"
        secureTextEntry={!showPassword}
        value={password}
        onChangeText={t => {
          setPassword(t);
          setError(null);
        }}
        leftIcon={<Lock color={theme.colors.textMuted} size={18} />}
        rightSlot={
          <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={8}>
            {showPassword ? (
              <EyeOff color={theme.colors.textMuted} size={18} />
            ) : (
              <Eye color={theme.colors.textMuted} size={18} />
            )}
          </Pressable>
        }
        containerStyle={styles.gap}
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
        title={loading ? 'Resetting…' : 'Reset password'}
        onPress={onSubmit}
        ready={ready}
        loading={loading}
        style={styles.submit}
      />
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
  gap: {marginTop: theme.spacing.md},
  error: {marginTop: theme.spacing.md},
  submit: {marginTop: theme.spacing.lg},
});
