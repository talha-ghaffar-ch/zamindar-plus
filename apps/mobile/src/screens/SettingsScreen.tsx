import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {
  ChevronRight,
  HelpCircle,
  Languages,
  Link2,
  LogOut,
  Mail,
  Phone,
  Ruler,
  Sprout,
  Unlink,
  User as UserIcon,
  Wallet,
} from 'lucide-react-native';
import {Screen} from '../components/Screen';
import {AppText} from '../components/AppText';
import {Card} from '../components/Card';
import {Button} from '../components/Button';
import {SectionHeader} from '../components/SectionHeader';
import {useAuth} from '../context/AuthContext';
import {theme} from '../theme';
import {haptics} from '../haptics';
import * as api from '../api';

export function SettingsScreen() {
  const navigation = useNavigation<any>();
  const {user, signOut, refreshUser} = useAuth();
  const [busy, setBusy] = useState<'google' | 'signout' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectGoogle = async () => {
    setError(null);
    setBusy('google');
    try {
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      const resp = await GoogleSignin.signIn();
      const idToken =
        (resp as any)?.data?.idToken ?? (resp as any)?.idToken ?? null;
      if (!idToken) {
        throw new Error('Google sign-in was cancelled.');
      }
      await api.connectGoogle(idToken);
      await refreshUser();
      haptics.success();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const disconnectGoogle = async () => {
    setError(null);
    setBusy('google');
    try {
      await api.disconnectGoogle();
      try {
        await GoogleSignin.signOut();
      } catch {
        // ignore
      }
      await refreshUser();
      haptics.success();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const connected = Boolean(user?.googleConnected);

  return (
    <Screen scroll>
      <AppText variant="h1" style={styles.title}>
        Settings
      </AppText>

      <Card elevated>
        <Row
          icon={<UserIcon color={theme.colors.primaryBright} size={18} />}
          label="Name"
          value={user ? `${user.firstName} ${user.lastName}` : '—'}
        />
        <Divider />
        <Row
          icon={<Mail color={theme.colors.textMuted} size={18} />}
          label="Email"
          value={user?.email ?? '—'}
        />
        <Divider />
        <Row
          icon={<Phone color={theme.colors.textMuted} size={18} />}
          label="Phone"
          value={user?.phone || 'Not set'}
        />
        <Divider />
        <Row
          icon={<Sprout color={theme.colors.textMuted} size={18} />}
          label="Farmer type"
          value={user?.farmerType || 'Not set'}
        />
      </Card>

      <SectionHeader title="Preferences" />
      <Card>
        <Row
          icon={<Ruler color={theme.colors.textMuted} size={18} />}
          label="Area unit"
          value={user?.preferredAreaUnit ?? '—'}
        />
        <Divider />
        <Row
          icon={<Wallet color={theme.colors.textMuted} size={18} />}
          label="Currency"
          value={user?.preferredCurrency ?? '—'}
        />
        <Divider />
        <Row
          icon={<Languages color={theme.colors.textMuted} size={18} />}
          label="Language"
          value={user?.preferredLanguage ?? '—'}
        />
      </Card>

      <SectionHeader title="Google account" />
      <Card>
        <Row
          icon={<Link2 color={connected ? theme.colors.income : theme.colors.textMuted} size={18} />}
          label="Status"
          value={connected ? 'Connected' : 'Not connected'}
        />
        <Button
          title={connected ? 'Disconnect Google' : 'Connect Google'}
          variant={connected ? 'secondary' : 'primary'}
          loading={busy === 'google'}
          disabled={busy !== null}
          icon={
            connected ? (
              <Unlink color={theme.colors.text} size={18} />
            ) : (
              <Link2 color={theme.colors.onPrimary} size={18} />
            )
          }
          onPress={connected ? disconnectGoogle : connectGoogle}
          style={styles.googleBtn}
        />
      </Card>

      <SectionHeader title="Support" />
      <Card padded={false}>
        <Pressable onPress={() => navigation.navigate('Help')} style={styles.helpRow}>
          <View style={styles.rowIcon}>
            <HelpCircle color={theme.colors.primary} size={18} />
          </View>
          <AppText variant="bodyStrong" style={styles.helpText}>
            Help & tips
          </AppText>
          <ChevronRight color={theme.colors.textMuted} size={18} />
        </Pressable>
      </Card>

      {error ? (
        <AppText variant="small" color={theme.colors.danger} style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <Button
        title="Sign out"
        variant="danger"
        loading={busy === 'signout'}
        disabled={busy !== null}
        icon={<LogOut color="#FFFFFF" size={18} />}
        onPress={async () => {
          setBusy('signout');
          await signOut();
        }}
        style={styles.signout}
      />
    </Screen>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowText}>
        <AppText variant="caption" color={theme.colors.textMuted}>
          {label.toUpperCase()}
        </AppText>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  title: {marginBottom: theme.spacing.xl},
  row: {flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.md},
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  rowText: {flex: 1},
  divider: {height: 1, backgroundColor: theme.colors.hairline},
  googleBtn: {marginTop: theme.spacing.md},
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  helpText: {flex: 1},
  error: {marginTop: theme.spacing.lg},
  signout: {marginTop: theme.spacing.xxl},
});
