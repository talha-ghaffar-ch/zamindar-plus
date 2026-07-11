import React, {useMemo, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Screen} from '../../components/Screen';
import {AppText} from '../../components/AppText';
import {Card} from '../../components/Card';
import {Chip} from '../../components/Chip';
import {DetailHeader} from '../../components/DetailHeader';
import {SectionHeader} from '../../components/SectionHeader';
import {TransactionRow} from '../../components/TransactionRow';
import {EmptyState} from '../../components/EmptyState';
import {useFarmData} from '../../context/FarmDataContext';
import {theme} from '../../theme';
import {compactCurrency, formatCurrency, monthName} from '../../format';
import type {RecordsStackParamList} from '../../navigation/types';

type Item = {
  id: string;
  cropId: string;
  title: string;
  subtitle: string;
  amount: number;
  date: string;
  filterKey: string;
};

export function LedgerScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RecordsStackParamList>>();
  const {params} = useRoute<RouteProp<RecordsStackParamList, 'Ledger'>>();
  const kind = params.kind;
  const {data} = useFarmData();
  const [filter, setFilter] = useState('All');

  const cropName = (id: string) =>
    data?.crops.find(c => c.id === id)?.cropName ?? 'Crop';

  const items: Item[] = useMemo(() => {
    if (!data) {
      return [];
    }
    if (kind === 'expense') {
      return data.expenses.map(e => ({
        id: e.id,
        cropId: e.cropId,
        title: e.expenseCategory,
        subtitle: `${e.description} · ${cropName(e.cropId)}`,
        amount: e.amount,
        date: e.expenseDate,
        filterKey: e.expenseCategory,
      }));
    }
    return data.income.map(i => ({
      id: i.id,
      cropId: i.cropId,
      title: i.buyerName || 'Crop sale',
      subtitle: `${i.quantity != null ? `${i.quantity} ${i.quantityUnit ?? ''} · ` : ''}${cropName(i.cropId)}`,
      amount: i.totalAmount,
      date: i.incomeDate,
      filterKey: i.paymentStatus ?? 'Other',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, kind]);

  const filterOptions = useMemo(
    () => ['All', ...Array.from(new Set(items.map(i => i.filterKey)))],
    [items],
  );
  const filtered = filter === 'All' ? items : items.filter(i => i.filterKey === filter);
  const total = filtered.reduce((s, i) => s + i.amount, 0);

  const groups = useMemo(() => {
    const map = new Map<string, {y: number; m: number; items: Item[]}>();
    for (const it of filtered) {
      const d = new Date(it.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map.has(key)) {
        map.set(key, {y: d.getFullYear(), m: d.getMonth(), items: []});
      }
      map.get(key)!.items.push(it);
    }
    return Array.from(map.values())
      .sort((a, b) => b.y - a.y || b.m - a.m)
      .map(g => ({
        label: `${monthName(g.m + 1, true)} ${g.y}`,
        total: g.items.reduce((s, i) => s + i.amount, 0),
        items: g.items.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      }));
  }, [filtered]);

  const tone = kind === 'expense' ? 'expense' : 'income';
  const toneColor = kind === 'expense' ? theme.colors.expense : theme.colors.income;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <DetailHeader
          title={kind === 'expense' ? 'All expenses' : 'All income'}
          subtitle={`${filtered.length} entries`}
          onBack={() => navigation.goBack()}
        />

        <Card elevated style={styles.summary}>
          <AppText variant="label" color={theme.colors.textMuted}>
            {kind === 'expense' ? 'TOTAL SPENT' : 'TOTAL RECEIVED'}
          </AppText>
          <AppText variant="numeric" color={toneColor} style={styles.total}>
            {formatCurrency(total)}
          </AppText>
        </Card>

        {filterOptions.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}>
            {filterOptions.map(f => (
              <Chip
                key={f}
                label={f}
                selected={f === filter}
                onPress={() => setFilter(f)}
              />
            ))}
          </ScrollView>
        ) : null}

        {groups.length === 0 ? (
          <EmptyState
            title={`No ${kind} yet`}
            message={`Add ${kind === 'expense' ? 'an expense' : 'income'} from the Add tab and it will show up here.`}
          />
        ) : (
          groups.map(g => (
            <View key={g.label} style={styles.group}>
              <SectionHeader title={g.label} actionLabel={compactCurrency(g.total)} onAction={() => {}} />
              <Card>
                {g.items.map((item, index) => (
                  <View key={item.id}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <TransactionRow
                      title={item.title}
                      subtitle={item.subtitle}
                      amount={item.amount}
                      tone={tone}
                      date={item.date}
                      onPress={() =>
                        navigation.navigate('CropDetail', {cropId: item.cropId})
                      }
                    />
                  </View>
                ))}
              </Card>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {padding: theme.spacing.xl, paddingBottom: theme.spacing.huge},
  summary: {marginBottom: theme.spacing.lg},
  total: {marginTop: 4},
  filters: {gap: theme.spacing.sm, paddingBottom: theme.spacing.lg},
  group: {marginBottom: theme.spacing.sm},
  divider: {height: 1, backgroundColor: theme.colors.hairline},
});
