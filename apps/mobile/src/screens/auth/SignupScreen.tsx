import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Eye, EyeOff, Lock, Mail, MailCheck, Phone} from 'lucide-react-native';
import {AuthScaffold} from '../../components/AuthScaffold';
import {AppText} from '../../components/AppText';
import {Button} from '../../components/Button';
import {AuthSubmitButton} from '../../components/AuthSubmitButton';
import {GoogleIcon} from '../../components/GoogleIcon';
import {Input} from '../../components/Input';
import {ChipGroup} from '../../components/ChipGroup';
import {useAuth} from '../../context/AuthContext';
import {theme} from '../../theme';
import {haptics} from '../../haptics';
import {farmerTypes} from '../../domain';
import * as api from '../../api';
import type {AuthStackParamList} from '../../navigation/types';

export function SignupScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const {signInWithGoogle} = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [farmerType, setFarmerType] = useState<string>(farmerTypes[0]);
  const [loading, setLoading] = useState<'password' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const ready =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(email) &&
    password.length >= 8;

  const onSubmit = async () => {
    if (!ready) {
      setError('Fill in your name, a valid email, and an 8+ character password.');
      return;
    }
    setError(null);
    setLoading('password');
    try {
      await api.signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        farmerType,
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

  if (sent) {
    return (
      <AuthScaffold
        eyebrow="Almost there"
        title="Check your inbox"
        subtitle={`We sent a verification code to ${email.trim()}. Verify your email, then sign in.`}
        onBack={() => navigation.navigate('Login')}>
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
          onPress={() => navigation.navigate('Login')}
          style={styles.gap}
        />
        <Pressable
          onPress={async () => {
            try {
              await api.resendVerification(email.trim());
              haptics.success();
            } catch {
              // surfaced elsewhere; keep quiet on the success screen
            }
          }}
          hitSlop={8}
          style={styles.resend}>
          <AppText variant="small" color={theme.colors.primary}>
            Resend email
          </AppText>
        </Pressable>
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold
      compactHero
      title="Create account"
      subtitle="Start your farm ledger in a couple of minutes."
      tabs={{
        active: 'signup',
        onChange: mode => {
          if (mode === 'login') {
            navigation.navigate('Login');
          }
        },
      }}>
      <Button
        title="Sign up with Google"
        variant="secondary"
        icon={<GoogleIcon />}
        onPress={onGoogle}
        loading={loading === 'google'}
        disabled={loading !== null}
      />

      <View style={[styles.row, styles.firstField]}>
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

      <Input
        label="Email"
        dense
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={t => {
          setEmail(t);
          setError(null);
        }}
        leftIcon={<Mail color={theme.colors.textMuted} size={18} />}
        containerStyle={styles.gap}
      />
      <Input
        label="Password"
        dense
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
      <Input
        label="Phone (optional)"
        dense
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        leftIcon={<Phone color={theme.colors.textMuted} size={18} />}
        containerStyle={styles.gap}
      />

      <View style={styles.gap}>
        <ChipGroup
          label="Farmer type"
          options={farmerTypes}
          value={farmerType}
          onChange={setFarmerType}
        />
      </View>

      {error ? (
        <AppText variant="small" color={theme.colors.danger} style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <AuthSubmitButton
        title={loading === 'password' ? 'Creating…' : 'Create account'}
        onPress={onSubmit}
        ready={ready}
        loading={loading === 'password'}
        disabled={loading !== null}
        style={styles.submit}
      />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  firstField: {marginTop: theme.spacing.lg},
  row: {flexDirection: 'row', gap: theme.spacing.md},
  half: {flex: 1},
  gap: {marginTop: theme.spacing.sm},
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
  resend: {marginTop: theme.spacing.lg, alignSelf: 'center'},
});
