import React, {useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Sprout} from 'lucide-react-native';
import {Screen} from '../../components/Screen';
import {AppText} from '../../components/AppText';
import {Card} from '../../components/Card';
import {Badge} from '../../components/Badge';
import {SectionHeader} from '../../components/SectionHeader';
import {DetailHeader} from '../../components/DetailHeader';
import {ListItemCard} from '../../components/ListItemCard';
import {EmptyState} from '../../components/EmptyState';
import {DeleteButton} from '../../components/DeleteButton';
import {EditButton} from '../../components/EditButton';
import {EditRecordModal} from '../../components/EditRecordModal';
import {useFarmData} from '../../context/FarmDataContext';
import {useI18n} from '../../i18n/useT';
import {theme} from '../../theme';
import {formatArea} from '../../format';
import * as api from '../../api';
import type {RecordsStackParamList} from '../../navigation/types';

export function ProfileDetailScreen() {
  const {t} = useI18n();
  const navigation =
    useNavigation<NativeStackNavigationProp<RecordsStackParamList>>();
  const {params} = useRoute<RouteProp<RecordsStackParamList, 'ProfileDetail'>>();
  const {data, reload} = useFarmData();
  const [editing, setEditing] = useState(false);

  const profile = data?.profiles.find(p => p.id === params.profileId);
  const zameen = (data?.zameen ?? []).filter(
    z => z.profileId === params.profileId,
  );
  const location = [profile?.villageName, profile?.city]
    .filter(Boolean)
    .join(', ');

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <DetailHeader
          title={profile?.profileName ?? 'Profile'}
          subtitle={location || t('mobile.locationNotSet')}
          onBack={() => navigation.goBack()}
          right={
            <View style={styles.headerActions}>
              <EditButton onPress={() => setEditing(true)} />
              <DeleteButton
                title={t('mobile.deleteProfile')}
                message={`Delete "${
                  profile?.profileName ?? 'this profile'
                }" and all its zameen, crops and records?`}
                onConfirm={async () => {
                  await api.deleteProfile(params.profileId);
                  await reload();
                  navigation.goBack();
                }}
              />
            </View>
          }
        />

        {profile?.chakAreaName ? (
          <Card style={styles.info}>
            <AppText variant="caption" color={theme.colors.textMuted}>
              CHAK / AREA
            </AppText>
            <AppText variant="bodyStrong" style={styles.infoValue}>
              {profile.chakAreaName}
            </AppText>
          </Card>
        ) : null}

        <SectionHeader title={`Zameen (${zameen.length})`} />
        {zameen.length === 0 ? (
          <EmptyState
            icon={<Sprout color={theme.colors.primaryBright} size={24} />}
            title={t('mobile.noLandAdded')}
            message={t('mobile.noLandBody')}
          />
        ) : (
          zameen.map(z => {
            const crops = (data?.crops ?? []).filter(c => c.zameenId === z.id);
            return (
              <ListItemCard
                key={z.id}
                title={z.zameenName}
                subtitle={formatArea(z.totalAreaValue, z.totalAreaUnit)}
                meta={`${crops.length} crops`}
                metaColor={theme.colors.textSecondary}
                badge={
                  z.ownershipType ? (
                    <Badge label={z.ownershipType} tone="primary" />
                  ) : undefined
                }
                onPress={() =>
                  navigation.navigate('ZameenDetail', {zameenId: z.id})
                }
              />
            );
          })
        )}
      </ScrollView>
      <EditRecordModal
        target={editing && profile ? {type: 'profile', data: profile} : null}
        onClose={() => setEditing(false)}
        onSaved={reload}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {padding: theme.spacing.xl, paddingBottom: theme.spacing.huge},
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  info: {marginBottom: theme.spacing.xl},
  infoValue: {marginTop: 4},
});
