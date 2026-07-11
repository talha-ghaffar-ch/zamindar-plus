import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ArrowLeft, MailCheck} from 'lucide-react-native';
import {Screen} from '../../components/Screen';
import {AppText} from '../../components/AppText';
import {Button} from '../../components/Button';
import {Input} from '../../components/Input';
import {ChipGroup} from '../../components/ChipGroup';
import {theme} from '../../theme';
import {haptics} from '../../haptics';
import {farmerTypes} from '../../domain';
import * as api from '../../api';
import type {AuthStackParamList} from '../../navigation/types';

export function SignupScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [farmerType, setFarmerType] = useState<string>(farmerTypes[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const valid =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(email) &&
    password.length >= 8;

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
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
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Screen scroll>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <MailCheck color={theme.colors.primaryBright} size={34} />
          </View>
          <AppText variant="h1" center style={styles.title}>
            Check your inbox
          </AppText>
          <AppText variant="body" color={theme.colors.textSecondary} center>
            We sent a verification link to {email.trim()}. Verify your email,
            then sign in.
          </AppText>
          <Button
            title="Enter verification code"
            onPress={() =>
              navigation.navigate('VerifyEmail', {email: email.trim()})
            }
            style={styles.successBtn}
          />
          <Button
            title="Back to sign in"
            variant="ghost"
            onPress={() => navigation.navigate('Login')}
            style={styles.successBtnGhost}
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
            <AppText variant="small" color={theme.colors.primaryBright}>
              Resend email
            </AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll dismissKeyboardOnTap>
      <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
        <ArrowLeft color={theme.colors.textSecondary} size={22} />
      </Pressable>

      <AppText variant="display" style={styles.heading}>
        Create account
      </AppText>
      <AppText variant="body" color={theme.colors.textSecondary} style={styles.sub}>
        Start keeping your farm ledger in order.
      </AppText>

      <View style={styles.row}>
        <Input
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          containerStyle={styles.half}
        />
        <Input
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          containerStyle={styles.half}
        />
      </View>

      <Input
        label="Email"
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        containerStyle={styles.gap}
      />
      <Input
        label="Password"
        placeholder="At least 8 characters"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        containerStyle={styles.gap}
      />
      <Input
        label="Phone (optional)"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
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

      <Button
        title="Create account"
        onPress={onSubmit}
        loading={loading}
        disabled={!valid || loading}
        style={styles.submit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {marginTop: theme.spacing.sm, marginBottom: theme.spacing.md},
  heading: {marginBottom: theme.spacing.sm},
  sub: {marginBottom: theme.spacing.xl},
  row: {flexDirection: 'row', gap: theme.spacing.md},
  half: {flex: 1},
  gap: {marginTop: theme.spacing.lg},
  error: {marginTop: theme.spacing.lg},
  submit: {marginTop: theme.spacing.xl},
  successWrap: {alignItems: 'center', marginTop: theme.spacing.huge},
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {marginBottom: theme.spacing.md},
  successBtn: {marginTop: theme.spacing.xxl},
  successBtnGhost: {marginTop: theme.spacing.xs},
  resend: {marginTop: theme.spacing.lg},
});
