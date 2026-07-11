import React from 'react';
import {RefreshControl, ScrollView, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MapPin, Layers} from 'lucide-react-native';
import {Screen} from '../../components/Screen';
import {AppText} from '../../components/AppText';
import {ListItemCard} from '../../components/ListItemCard';
import {Skeleton} from '../../components/Skeleton';
import {EmptyState} from '../../components/EmptyState';
import {useFarmData} from '../../context/FarmDataContext';
import {theme} from '../../theme';
import type {RecordsStackParamList} from '../../navigation/types';

export function RecordsScreen() {
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
            tintColor={theme.colors.primaryBright}
            colors={[theme.colors.primaryBright]}
          />
        }>
        <AppText variant="h1" style={styles.title}>
          Records
        </AppText>
        <AppText variant="body" color={theme.colors.textSecondary} style={styles.sub}>
          Your farm profiles, land, and crops.
        </AppText>

        {status === 'loading' ? (
          <View style={styles.gap}>
            <Skeleton height={78} radius={20} style={styles.skel} />
            <Skeleton height={78} radius={20} style={styles.skel} />
            <Skeleton height={78} radius={20} style={styles.skel} />
          </View>
        ) : profiles.length === 0 ? (
          <EmptyState
            icon={<Layers color={theme.colors.primaryBright} size={26} />}
            title="No farm profiles yet"
            message="Create a profile from the Add tab to start tracking your zameen and crops."
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
                subtitle={location || 'Location not set'}
                meta={`${zameen.length} zameen`}
                metaColor={theme.colors.textSecondary}
                leading={
                  <View style={styles.iconWrap}>
                    <MapPin color={theme.colors.primaryBright} size={18} />
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

const styles = StyleSheet.create({
  content: {padding: theme.spacing.xl, paddingBottom: theme.spacing.huge},
  title: {marginBottom: 2},
  sub: {marginBottom: theme.spacing.xl},
  gap: {marginTop: theme.spacing.sm},
  skel: {marginBottom: theme.spacing.md},
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
