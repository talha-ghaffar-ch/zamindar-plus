import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Eye, EyeOff, Lock, Mail} from 'lucide-react-native';
import {AuthScaffold} from '../../components/AuthScaffold';
import {AppText} from '../../components/AppText';
import {Button} from '../../components/Button';
import {AuthSubmitButton} from '../../components/AuthSubmitButton';
import {GoogleIcon} from '../../components/GoogleIcon';
import {Input} from '../../components/Input';
import {useAuth} from '../../context/AuthContext';
import {theme} from '../../theme';
import {haptics} from '../../haptics';
import type {AuthStackParamList} from '../../navigation/types';

export function LoginScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const {signInWithPassword, signInWithGoogle} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<'password' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ready = /\S+@\S+\.\S+/.test(email) && password.length >= 8;

  const onLogin = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError(null);
    setLoading('password');
    try {
      await signInWithPassword(email, password);
      haptics.success();
    } catch (e) {
      haptics.error();
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const onGoogle = async () => {
    setError(null);
    setLoading('google');
    try {
      await signInWithGoogle();
      haptics.success();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <AuthScaffold
      title="Sign in"
      subtitle="Open your farm dashboard and continue from your latest records."
      tabs={{
        active: 'login',
        onChange: mode => {
          if (mode === 'signup') {
            navigation.navigate('Signup');
          }
        },
      }}>
      <Button
        title="Sign in with Google"
        variant="secondary"
        icon={<GoogleIcon />}
        onPress={onGoogle}
        loading={loading === 'google'}
        disabled={loading !== null}
      />

      <View style={styles.divider}>
        <View style={styles.line} />
        <AppText variant="caption" color={theme.colors.textMuted}>
          OR SIGN IN WITH EMAIL
        </AppText>
        <View style={styles.line} />
      </View>

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
      <Input
        label="Password"
        placeholder="••••••••"
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

      <Pressable
        onPress={() => navigation.navigate('ForgotPassword')}
        hitSlop={8}
        style={styles.forgot}>
        <AppText variant="small" color={theme.colors.primary}>
          Forgot password?
        </AppText>
      </Pressable>

      {error ? (
        <AppText variant="small" color={theme.colors.danger} style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <AuthSubmitButton
        title={loading === 'password' ? 'Signing in…' : 'Sign in'}
        onPress={onLogin}
        ready={ready}
        loading={loading === 'password'}
        disabled={loading !== null}
        style={styles.submit}
      />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginVertical: theme.spacing.lg,
  },
  line: {flex: 1, height: 1, backgroundColor: theme.colors.border},
  gap: {marginTop: theme.spacing.md},
  forgot: {alignSelf: 'flex-end', marginTop: theme.spacing.md},
  error: {marginTop: theme.spacing.md},
  submit: {marginTop: theme.spacing.lg},
});
