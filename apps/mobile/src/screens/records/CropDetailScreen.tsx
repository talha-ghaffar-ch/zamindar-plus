import React, {useMemo, useState} from 'react';
import {Alert, ScrollView, StyleSheet, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {Screen} from '../../components/Screen';
import {AppText} from '../../components/AppText';
import {Card} from '../../components/Card';
import {Badge, toneForStatus} from '../../components/Badge';
import {SectionHeader} from '../../components/SectionHeader';
import {DetailHeader} from '../../components/DetailHeader';
import {DeleteButton} from '../../components/DeleteButton';
import {EditButton} from '../../components/EditButton';
import {EditRecordModal, EditTarget} from '../../components/EditRecordModal';
import {TransactionRow} from '../../components/TransactionRow';
import {useFarmData} from '../../context/FarmDataContext';
import {theme} from '../../theme';
import {formatArea, formatCurrency, monthName} from '../../format';
import * as api from '../../api';
import type {RecordsStackParamList} from '../../navigation/types';

export function CropDetailScreen() {
  const navigation = useNavigation();
  const {params} = useRoute<RouteProp<RecordsStackParamList, 'CropDetail'>>();
  const {data, reload} = useFarmData();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const crop = data?.crops.find(c => c.id === params.cropId);
  const expenses = (data?.expenses ?? []).filter(e => e.cropId === params.cropId);
  const income = (data?.income ?? []).filter(i => i.cropId === params.cropId);

  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = income.reduce((s, i) => s + i.totalAmount, 0);
  const net = totalIncome - totalExpense;

  const ledger = useMemo(() => {
    const e = expenses.map(x => ({
      id: `e-${x.id}`,
      realId: x.id,
      kind: 'expense' as const,
      title: x.expenseCategory,
      subtitle: x.description,
      amount: x.amount,
      date: x.expenseDate,
    }));
    const i = income.map(x => ({
      id: `i-${x.id}`,
      realId: x.id,
      kind: 'income' as const,
      title: x.buyerName || 'Crop sale',
      subtitle:
        x.quantity != null ? `${x.quantity} ${x.quantityUnit ?? ''}`.trim() : undefined,
      amount: x.totalAmount,
      date: x.incomeDate,
    }));
    return [...e, ...i].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [expenses, income]);

  const entryTarget = (entry: (typeof ledger)[number]): EditTarget | null => {
    if (entry.kind === 'expense') {
      const found = expenses.find(x => x.id === entry.realId);
      return found ? {type: 'expense', data: found} : null;
    }
    const found = income.find(x => x.id === entry.realId);
    return found ? {type: 'income', data: found} : null;
  };

  const confirmDeleteEntry = (entry: (typeof ledger)[number]) => {
    Alert.alert(
      `Delete ${entry.kind}`,
      `Delete "${entry.title}" (${formatCurrency(entry.amount)})?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (entry.kind === 'expense') {
                await api.deleteExpense(entry.realId);
              } else {
                await api.deleteIncome(entry.realId);
              }
              await reload();
            } catch (e) {
              Alert.alert('Could not delete', (e as Error).message);
            }
          },
        },
      ],
    );
  };

  const start =
    crop?.startMonth && crop?.startYear
      ? `${monthName(crop.startMonth)} ${crop.startYear}`
      : undefined;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <DetailHeader
          title={crop?.cropName ?? 'Crop'}
          subtitle={crop ? formatArea(crop.cropAreaValue, crop.cropAreaUnit) : undefined}
          onBack={() => navigation.goBack()}
          right={
            <View style={styles.headerRight}>
              {crop ? (
                <Badge label={crop.status} tone={toneForStatus(crop.status)} />
              ) : null}
              <EditButton
                onPress={() =>
                  crop && setEditTarget({type: 'crop', data: crop})
                }
              />
              <DeleteButton
                title="Delete crop"
                message={`Delete "${
                  crop?.cropName ?? 'this crop'
                }" and all its expenses and income?`}
                onConfirm={async () => {
                  await api.deleteCrop(params.cropId);
                  await reload();
                  navigation.goBack();
                }}
              />
            </View>
          }
        />

        <Card elevated style={styles.summary}>
          <AppText variant="caption" color={theme.colors.textMuted}>
            NET PROFIT{start ? ` · SINCE ${start.toUpperCase()}` : ''}
          </AppText>
          <AppText
            variant="numeric"
            color={net >= 0 ? theme.colors.income : theme.colors.expense}
            style={styles.net}>
            {formatCurrency(net)}
          </AppText>
          <View style={styles.splitRow}>
            <View>
              <AppText variant="small" color={theme.colors.textMuted}>
                Income
              </AppText>
              <AppText variant="bodyStrong" color={theme.colors.income}>
                {formatCurrency(totalIncome)}
              </AppText>
            </View>
            <View>
              <AppText variant="small" color={theme.colors.textMuted}>
                Expenses
              </AppText>
              <AppText variant="bodyStrong" color={theme.colors.expense}>
                {formatCurrency(totalExpense)}
              </AppText>
            </View>
          </View>
        </Card>

        <SectionHeader title={`Ledger (${ledger.length})`} />
        {ledger.length === 0 ? (
          <Card>
            <AppText variant="body" color={theme.colors.textSecondary} center>
              No expenses or income recorded for this crop yet.
            </AppText>
          </Card>
        ) : (
          <>
            <Card>
              {ledger.map((item, index) => (
                <View key={item.id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <TransactionRow
                    title={item.title}
                    subtitle={item.subtitle}
                    amount={item.amount}
                    tone={item.kind}
                    date={item.date}
                    onPress={() => {
                      const t = entryTarget(item);
                      if (t) {
                        setEditTarget(t);
                      }
                    }}
                    onLongPress={() => confirmDeleteEntry(item)}
                  />
                </View>
              ))}
            </Card>
            <AppText variant="small" color={theme.colors.textMuted} center style={styles.hint}>
              Tap an entry to edit · long-press to delete.
            </AppText>
          </>
        )}
      </ScrollView>

      <EditRecordModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={reload}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {padding: theme.spacing.xl, paddingBottom: theme.spacing.huge},
  headerRight: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md},
  summary: {marginBottom: theme.spacing.xl},
  net: {marginTop: theme.spacing.sm, marginBottom: theme.spacing.lg},
  splitRow: {flexDirection: 'row', gap: theme.spacing.huge},
  divider: {height: 1, backgroundColor: theme.colors.hairline},
  hint: {marginTop: theme.spacing.md},
});
