import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {Eye, EyeOff, Lock, Mail, MailCheck, Phone} from 'lucide-react-native';
import {AuthScaffold} from '../../components/AuthScaffold';
import {AppText} from '../../components/AppText';
import {Button} from '../../components/Button';
import {AuthSubmitButton} from '../../components/AuthSubmitButton';
import {GoogleIcon} from '../../components/GoogleIcon';
import {Input} from '../../components/Input';
import {useAuth} from '../../context/AuthContext';
import {theme} from '../../theme';
import {haptics} from '../../haptics';
import * as api from '../../api';
import type {AuthStackParamList} from '../../navigation/types';

type Mode = 'login' | 'signup';

const emailValid = (e: string) => /\S+@\S+\.\S+/.test(e);

/**
 * Single auth page: sign in and create account share the same page. Switching
 * tabs only crossfades the card content — the "Zamindar Plus" hero and the
 * background image stay mounted and fixed.
 */
export function LoginScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const {signInWithPassword, signInWithGoogle} = useAuth();

  // `mode` = selected tab (updates instantly); `content` = form shown (swaps at
  // the fade trough so the crossfade is clean).
  const [mode, setMode] = useState<Mode>('login');
  const [content, setContent] = useState<Mode>('login');
  const fade = useSharedValue(1);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState<'password' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{translateY: (1 - fade.value) * 10}],
  }));

  const switchTo = (m: Mode) => {
    if (m === mode || loading) {
      return;
    }
    setMode(m);
    setError(null);
    fade.value = withTiming(0, {duration: 150}, finished => {
      if (finished) {
        runOnJS(setContent)(m);
        fade.value = withTiming(1, {duration: 240});
      }
    });
  };

  const resetToLogin = () => {
    setSent(false);
    setMode('login');
    setContent('login');
  };

  const loginReady = emailValid(email) && password.length >= 8;
  const signupReady =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    emailValid(email) &&
    password.length >= 8;

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

  const onSubmit = async () => {
    setError(null);
    if (content === 'login') {
      if (!email.trim() || !password) {
        setError('Enter your email and password.');
        return;
      }
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
      return;
    }

    if (!signupReady) {
      setError('Fill in your name, a valid email, and an 8+ character password.');
      return;
    }
    setLoading('password');
    try {
      await api.signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      haptics.success();
      setSent(true);
    } catch (e) {
      haptics.error();
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  };

  if (sent) {
    return (
      <AuthScaffold
        eyebrow="Almost there"
        title="Check your inbox"
        subtitle={`We sent a verification code to ${email.trim()}. Verify your email, then sign in.`}
        onBack={resetToLogin}>
        <View style={styles.successIcon}>
          <MailCheck color={theme.colors.primaryBright} size={32} />
        </View>
        <Button
          title="Enter verification code"
          onPress={() =>
            navigation.navigate('VerifyEmail', {email: email.trim()})
          }
        />
        <Button
          title="Back to sign in"
          variant="ghost"
          onPress={resetToLogin}
          style={styles.gap}
        />
      </AuthScaffold>
    );
  }

  const isSignup = content === 'signup';

  return (
    <AuthScaffold tabs={{active: mode, onChange: switchTo}}>
      <Animated.View style={contentStyle}>
        <AppText variant="h1" style={styles.title}>
          {isSignup ? 'Create account' : 'Sign in'}
        </AppText>
        <AppText
          variant="body"
          color={theme.colors.textSecondary}
          style={styles.subtitle}>
          {isSignup
            ? 'Set up your farm ledger in a couple of minutes.'
            : 'Pick up right where you left off.'}
        </AppText>

        <Button
          title={isSignup ? 'Sign up with Google' : 'Sign in with Google'}
          variant="secondary"
          icon={<GoogleIcon />}
          onPress={onGoogle}
          loading={loading === 'google'}
          disabled={loading !== null}
        />

        <View style={styles.divider}>
          <View style={styles.line} />
          <AppText variant="caption" color={theme.colors.textMuted}>
            {isSignup ? 'OR SIGN UP WITH EMAIL' : 'OR SIGN IN WITH EMAIL'}
          </AppText>
          <View style={styles.line} />
        </View>

        {isSignup ? (
          <View style={styles.row}>
            <Input
              label="First name"
              dense
              value={firstName}
              onChangeText={t => {
                setFirstName(t);
                setError(null);
              }}
              containerStyle={styles.half}
            />
            <Input
              label="Last name"
              dense
              value={lastName}
              onChangeText={t => {
                setLastName(t);
                setError(null);
              }}
              containerStyle={styles.half}
            />
          </View>
        ) : null}

        <Input
          label="Email"
          dense={isSignup}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={t => {
            setEmail(t);
            setError(null);
          }}
          leftIcon={<Mail color={theme.colors.textMuted} size={18} />}
          containerStyle={isSignup ? styles.gap : undefined}
        />
        <Input
          label="Password"
          dense={isSignup}
          placeholder={isSignup ? 'At least 8 characters' : '••••••••'}
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

        {isSignup ? (
          <Input
            label="Phone (optional)"
            dense
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            leftIcon={<Phone color={theme.colors.textMuted} size={18} />}
            containerStyle={styles.gap}
          />
        ) : (
          <Pressable
            onPress={() => navigation.navigate('ForgotPassword')}
            hitSlop={8}
            style={styles.forgot}>
            <AppText variant="small" color={theme.colors.primary}>
              Forgot password?
            </AppText>
          </Pressable>
        )}

        {error ? (
          <AppText
            variant="small"
            color={theme.colors.danger}
            style={styles.error}>
            {error}
          </AppText>
        ) : null}

        <AuthSubmitButton
          title={
            loading === 'password'
              ? isSignup
                ? 'Creating…'
                : 'Signing in…'
              : isSignup
                ? 'Create account'
                : 'Sign in'
          }
          onPress={onSubmit}
          ready={isSignup ? signupReady : loginReady}
          loading={loading === 'password'}
          disabled={loading !== null}
          style={styles.submit}
        />
      </Animated.View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  title: {marginBottom: 5},
  subtitle: {marginBottom: theme.spacing.md},
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginVertical: theme.spacing.md,
  },
  line: {flex: 1, height: 1, backgroundColor: theme.colors.border},
  row: {flexDirection: 'row', gap: theme.spacing.md},
  half: {flex: 1},
  gap: {marginTop: theme.spacing.sm},
  forgot: {alignSelf: 'flex-end', marginTop: theme.spacing.md},
  error: {marginTop: theme.spacing.md},
  submit: {marginTop: theme.spacing.lg},
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: theme.spacing.xl,
  },
});
