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
import {LOCALE_LIST, localeToPreferredLanguage, type Locale} from '@zamindar/shared';
import {useAuth} from '../context/AuthContext';
import {useI18n} from '../i18n/useT';
import {theme} from '../theme';
import {haptics} from '../haptics';
import * as api from '../api';

export function SettingsScreen() {
  const navigation = useNavigation<any>();
  const {user, signOut, refreshUser} = useAuth();
  const {t, locale, setLocale} = useI18n();
  const [busy, setBusy] = useState<'google' | 'signout' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Switch the interface immediately, then save the choice to the account so
  // it follows the user to the web app.
  const changeLanguage = (next: Locale) => {
    if (next === locale) {
      return;
    }
    haptics.light();
    setLocale(next);
    if (user) {
      api
        .updateUser(user.id, {
          preferredLanguage: localeToPreferredLanguage(next),
        })
        .then(() => refreshUser())
        .catch(() => {
          // The choice is saved on the device; syncing can retry later.
        });
    }
  };

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
          label={t('mobile.name')}
          value={user ? `${user.firstName} ${user.lastName}` : '—'}
        />
        <Divider />
        <Row
          icon={<Mail color={theme.colors.textMuted} size={18} />}
          label={t('mobile.email')}
          value={user?.email ?? '—'}
        />
        <Divider />
        <Row
          icon={<Phone color={theme.colors.textMuted} size={18} />}
          label={t('mobile.phone')}
          value={user?.phone || t('mobile.notSet')}
        />
        <Divider />
        <Row
          icon={<Sprout color={theme.colors.textMuted} size={18} />}
          label={t('mobile.farmerType')}
          value={user?.farmerType || t('mobile.notSet')}
        />
      </Card>

      <SectionHeader title={t('mobile.preferences')} />
      <Card>
        <Row
          icon={<Ruler color={theme.colors.textMuted} size={18} />}
          label={t('mobile.areaUnit')}
          value={user?.preferredAreaUnit ?? '—'}
        />
        <Divider />
        <Row
          icon={<Wallet color={theme.colors.textMuted} size={18} />}
          label={t('mobile.currency')}
          value={user?.preferredCurrency ?? '—'}
        />
        <Divider />
        <View style={styles.languageBlock}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Languages color={theme.colors.textMuted} size={18} />
            </View>
            <View style={styles.rowText}>
              <AppText variant="caption" color={theme.colors.textMuted}>
                {t('language.title').toUpperCase()}
              </AppText>
              <AppText variant="caption" color={theme.colors.textSecondary}>
                {t('language.subtitle')}
              </AppText>
            </View>
          </View>
          <View style={styles.languageOptions}>
            {LOCALE_LIST.map(meta => {
              const active = meta.code === locale;
              return (
                <Pressable
                  key={meta.code}
                  onPress={() => { changeLanguage(meta.code); }}
                  style={[
                    styles.languageOption,
                    active && styles.languageOptionActive,
                  ]}>
                  <AppText
                    variant="bodyStrong"
                    color={active ? theme.colors.onPrimary : theme.colors.text}>
                    {meta.nativeLabel}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>

      <SectionHeader title={t('mobile.googleAccount')} />
      <Card>
        <Row
          icon={<Link2 color={connected ? theme.colors.income : theme.colors.textMuted} size={18} />}
          label={t('mobile.status')}
          value={connected ? t('mobile.connected') : t('mobile.notConnected')}
        />
        <Button
          title={connected ? t('mobile.disconnectGoogle') : t('mobile.connectGoogle')}
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

      <SectionHeader title={t('mobile.support')} />
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
        title={t('mobile.signOut')}
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
  languageBlock: {gap: theme.spacing.md, paddingVertical: theme.spacing.sm},
  languageOptions: {flexDirection: 'row', gap: theme.spacing.sm},
  languageOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
  },
  languageOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
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
