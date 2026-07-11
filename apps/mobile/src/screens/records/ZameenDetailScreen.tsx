import React, {useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Wheat} from 'lucide-react-native';
import {Screen} from '../../components/Screen';
import {Badge, toneForStatus} from '../../components/Badge';
import {SectionHeader} from '../../components/SectionHeader';
import {DetailHeader} from '../../components/DetailHeader';
import {ListItemCard} from '../../components/ListItemCard';
import {EmptyState} from '../../components/EmptyState';
import {DeleteButton} from '../../components/DeleteButton';
import {EditButton} from '../../components/EditButton';
import {EditRecordModal} from '../../components/EditRecordModal';
import {useFarmData} from '../../context/FarmDataContext';
import {theme} from '../../theme';
import {compactCurrency, formatArea, monthName} from '../../format';
import * as api from '../../api';
import type {RecordsStackParamList} from '../../navigation/types';

export function ZameenDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RecordsStackParamList>>();
  const {params} = useRoute<RouteProp<RecordsStackParamList, 'ZameenDetail'>>();
  const {data, reload} = useFarmData();
  const [editing, setEditing] = useState(false);

  const zameen = data?.zameen.find(z => z.id === params.zameenId);
  const crops = (data?.crops ?? []).filter(c => c.zameenId === params.zameenId);

  const netForCrop = (cropId: string) => {
    const inc = (data?.income ?? [])
      .filter(i => i.cropId === cropId)
      .reduce((s, i) => s + i.totalAmount, 0);
    const exp = (data?.expenses ?? [])
      .filter(e => e.cropId === cropId)
      .reduce((s, e) => s + e.amount, 0);
    return inc - exp;
  };

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <DetailHeader
          title={zameen?.zameenName ?? 'Zameen'}
          subtitle={
            zameen
              ? `${formatArea(zameen.totalAreaValue, zameen.totalAreaUnit)}${
                  zameen.ownershipType ? ` · ${zameen.ownershipType}` : ''
                }`
              : undefined
          }
          onBack={() => navigation.goBack()}
          right={
            <View style={styles.headerActions}>
              <EditButton onPress={() => setEditing(true)} />
              <DeleteButton
                title="Delete zameen"
                message={`Delete "${
                  zameen?.zameenName ?? 'this zameen'
                }" and all its crops and records?`}
                onConfirm={async () => {
                  await api.deleteZameen(params.zameenId);
                  await reload();
                  navigation.goBack();
                }}
              />
            </View>
          }
        />

        <SectionHeader title={`Crops (${crops.length})`} />
        {crops.length === 0 ? (
          <EmptyState
            icon={<Wheat color={theme.colors.primaryBright} size={24} />}
            title="No crops yet"
            message="Add a crop to this land from the Add tab."
          />
        ) : (
          crops.map(c => {
            const net = netForCrop(c.id);
            const start =
              c.startMonth && c.startYear
                ? `${monthName(c.startMonth)} ${c.startYear}`
                : 'Start not set';
            return (
              <ListItemCard
                key={c.id}
                title={c.cropName}
                subtitle={`${formatArea(c.cropAreaValue, c.cropAreaUnit)} · ${start}`}
                meta={compactCurrency(net)}
                metaColor={net >= 0 ? theme.colors.income : theme.colors.expense}
                badge={<Badge label={c.status} tone={toneForStatus(c.status)} />}
                onPress={() => navigation.navigate('CropDetail', {cropId: c.id})}
              />
            );
          })
        )}
      </ScrollView>
      <EditRecordModal
        target={editing && zameen ? {type: 'zameen', data: zameen} : null}
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
});
