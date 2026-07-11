import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Eye, EyeOff, Lock, Mail, Sprout} from 'lucide-react-native';
import {Screen} from '../../components/Screen';
import {AppText} from '../../components/AppText';
import {Button} from '../../components/Button';
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
    <Screen scroll dismissKeyboardOnTap>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Sprout color={theme.colors.primaryBright} size={34} strokeWidth={2.2} />
        </View>
        <AppText variant="display" style={styles.title}>
          Zamindar Plus
        </AppText>
        <AppText variant="body" color={theme.colors.textSecondary} center>
          Sign in to manage your zameen, crops, and ledger.
        </AppText>
      </View>

      <View style={styles.form}>
        <Input
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          leftIcon={<Mail color={theme.colors.textMuted} size={18} />}
        />
        <Input
          label="Password"
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
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
          <AppText variant="small" color={theme.colors.primaryBright}>
            Forgot password?
          </AppText>
        </Pressable>

        {error ? (
          <AppText variant="small" color={theme.colors.danger} style={styles.error}>
            {error}
          </AppText>
        ) : null}

        <Button
          title="Sign in"
          onPress={onLogin}
          loading={loading === 'password'}
          disabled={loading !== null}
          style={styles.gap}
        />

        <View style={styles.divider}>
          <View style={styles.line} />
          <AppText variant="small" color={theme.colors.textMuted}>
            or
          </AppText>
          <View style={styles.line} />
        </View>

        <Button
          title="Continue with Google"
          variant="secondary"
          onPress={onGoogle}
          loading={loading === 'google'}
          disabled={loading !== null}
        />

        <View style={styles.footer}>
          <AppText variant="body" color={theme.colors.textSecondary}>
            Don't have an account?{' '}
          </AppText>
          <Pressable onPress={() => navigation.navigate('Signup')} hitSlop={8}>
            <AppText variant="bodyStrong" color={theme.colors.primaryBright}>
              Sign up
            </AppText>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xxxl,
    marginBottom: theme.spacing.xxxl,
  },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {marginBottom: theme.spacing.sm},
  form: {width: '100%'},
  gap: {marginTop: theme.spacing.lg},
  forgot: {alignSelf: 'flex-end', marginTop: theme.spacing.md},
  error: {marginTop: theme.spacing.md},
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginVertical: theme.spacing.xl,
  },
  line: {flex: 1, height: 1, backgroundColor: theme.colors.border},
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.xxl,
  },
});
