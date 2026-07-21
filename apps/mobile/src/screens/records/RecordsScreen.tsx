import React from 'react';
import {RefreshControl, ScrollView, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Layers, MapPin, TrendingDown, TrendingUp} from 'lucide-react-native';
import {Screen} from '../../components/Screen';
import {AppText} from '../../components/AppText';
import {Card} from '../../components/Card';
import {ListItemCard} from '../../components/ListItemCard';
import {SectionHeader} from '../../components/SectionHeader';
import {Skeleton} from '../../components/Skeleton';
import {EmptyState} from '../../components/EmptyState';
import {useFarmData} from '../../context/FarmDataContext';
import {useI18n} from '../../i18n/useT';
import {theme} from '../../theme';
import type {RecordsStackParamList} from '../../navigation/types';

export function RecordsScreen() {
  const {t} = useI18n();
  const navigation =
    useNavigation<NativeStackNavigationProp<RecordsStackParamList>>();
  const {data, status, refreshing, refresh} = useFarmData();
  const profiles = data?.profiles ?? [];

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }>
        <AppText variant="h1" style={styles.title}>
          Records
        </AppText>
        <AppText variant="body" color={theme.colors.textSecondary} style={styles.sub}>
          Your farm profiles, land, crops and ledgers.
        </AppText>

        <View style={styles.ledgerRow}>
          <LedgerCard
            label={t('mobile.allExpenses')}
            tint={theme.palette.roseSoft}
            color={theme.colors.expense}
            icon={<TrendingDown color={theme.colors.expense} size={20} />}
            onPress={() => navigation.navigate('Ledger', {kind: 'expense'})}
          />
          <LedgerCard
            label={t('mobile.allIncome')}
            tint={theme.palette.greenSoft}
            color={theme.colors.income}
            icon={<TrendingUp color={theme.colors.income} size={20} />}
            onPress={() => navigation.navigate('Ledger', {kind: 'income'})}
          />
        </View>

        <SectionHeader title={t('mobile.farmProfiles')} />
        {status === 'loading' ? (
          <View>
            <Skeleton height={78} radius={12} style={styles.skel} />
            <Skeleton height={78} radius={12} style={styles.skel} />
          </View>
        ) : profiles.length === 0 ? (
          <EmptyState
            icon={<Layers color={theme.colors.primary} size={26} />}
            title={t('mobile.noProfilesYet')}
            message={t('mobile.noProfilesBody')}
          />
        ) : (
          profiles.map(profile => {
            const zameen = (data?.zameen ?? []).filter(
              z => z.profileId === profile.id,
            );
            const location = [profile.villageName, profile.city]
              .filter(Boolean)
              .join(', ');
            return (
              <ListItemCard
                key={profile.id}
                title={profile.profileName}
                subtitle={location || t('mobile.locationNotSet')}
                meta={`${zameen.length} zameen`}
                metaColor={theme.colors.textSecondary}
                leading={
                  <View style={styles.iconWrap}>
                    <MapPin color={theme.colors.primary} size={18} />
                  </View>
                }
                onPress={() =>
                  navigation.navigate('ProfileDetail', {profileId: profile.id})
                }
              />
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

function LedgerCard({
  label,
  tint,
  color,
  icon,
  onPress,
}: {
  label: string;
  tint: string;
  color: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} style={styles.ledgerCard}>
      <View style={[styles.ledgerIcon, {backgroundColor: tint}]}>{icon}</View>
      <AppText variant="bodyStrong" style={styles.ledgerLabel}>
        {label}
      </AppText>
      <AppText variant="small" color={color}>
        View all →
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {padding: theme.spacing.xl, paddingBottom: theme.spacing.huge},
  title: {marginBottom: 2},
  sub: {marginBottom: theme.spacing.xl},
  ledgerRow: {flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.xl},
  ledgerCard: {flex: 1},
  ledgerIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  ledgerLabel: {marginBottom: 2},
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.softStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skel: {marginBottom: theme.spacing.md},
});
