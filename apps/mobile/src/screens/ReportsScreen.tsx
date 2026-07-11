import React, {useMemo} from 'react';
import {RefreshControl, ScrollView, StyleSheet, View} from 'react-native';
import {TrendingDown, TrendingUp} from 'lucide-react-native';
import {Screen} from '../components/Screen';
import {AppText} from '../components/AppText';
import {Card} from '../components/Card';
import {StatTile} from '../components/StatTile';
import {SectionHeader} from '../components/SectionHeader';
import {Skeleton} from '../components/Skeleton';
import {EmptyState} from '../components/EmptyState';
import {ListItemCard} from '../components/ListItemCard';
import {useFarmData} from '../context/FarmDataContext';
import {theme} from '../theme';
import {compactCurrency, formatCurrency, monthName} from '../format';

const CHART_HEIGHT = 130;

export function ReportsScreen() {
  const {data, status, refreshing, refresh} = useFarmData();
  const summary = data?.summary;

  const months = useMemo(
    () =>
      (data?.monthlyReports ?? [])
        .slice()
        .sort((a, b) => a.year - b.year || a.month - b.month)
        .slice(-6),
    [data],
  );
  const maxVal = Math.max(
    1,
    ...months.flatMap(m => [m.totalIncome, m.totalExpense]),
  );

  const profitability = useMemo(
    () =>
      (data?.cropProfitability ?? [])
        .slice()
        .sort((a, b) => b.netProfit - a.netProfit),
    [data],
  );

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
          Reports
        </AppText>

        {status === 'loading' ? (
          <View>
            <Skeleton height={92} radius={20} style={styles.skel} />
            <Skeleton height={200} radius={20} style={styles.skel} />
            <Skeleton height={140} radius={20} />
          </View>
        ) : (
          <>
            <View style={styles.tiles}>
              <StatTile
                label="Income"
                value={compactCurrency(summary?.totalIncome ?? 0)}
                tone="income"
                icon={<TrendingUp color={theme.colors.income} size={16} />}
              />
              <StatTile
                label="Expenses"
                value={compactCurrency(summary?.totalExpense ?? 0)}
                tone="expense"
                icon={<TrendingDown color={theme.colors.expense} size={16} />}
              />
            </View>
            <StatTile
              label="Net profit"
              value={formatCurrency(summary?.netProfit ?? 0)}
              tone={(summary?.netProfit ?? 0) >= 0 ? 'income' : 'expense'}
              style={styles.netTile}
            />

            <Card elevated style={styles.chartCard}>
              <View style={styles.chartHead}>
                <AppText variant="h3">Monthly trend</AppText>
                <View style={styles.legend}>
                  <Legend color={theme.colors.income} label="In" />
                  <Legend color={theme.colors.expense} label="Out" />
                </View>
              </View>
              {months.length === 0 ? (
                <AppText variant="body" color={theme.colors.textSecondary} center style={styles.noData}>
                  No monthly data yet.
                </AppText>
              ) : (
                <View style={styles.chart}>
                  {months.map(m => (
                    <View key={`${m.year}-${m.month}`} style={styles.barGroup}>
                      <View style={styles.bars}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: Math.max(
                                2,
                                (m.totalIncome / maxVal) * CHART_HEIGHT,
                              ),
                              backgroundColor: theme.colors.income,
                            },
                          ]}
                        />
                        <View
                          style={[
                            styles.bar,
                            {
                              height: Math.max(
                                2,
                                (m.totalExpense / maxVal) * CHART_HEIGHT,
                              ),
                              backgroundColor: theme.colors.expense,
                            },
                          ]}
                        />
                      </View>
                      <AppText variant="caption" color={theme.colors.textMuted}>
                        {monthName(m.month)}
                      </AppText>
                    </View>
                  ))}
                </View>
              )}
            </Card>

            <SectionHeader title="Crop profitability" />
            {profitability.length === 0 ? (
              <EmptyState
                title="No crop data yet"
                message="Add crops with expenses and income to see profitability."
              />
            ) : (
              profitability.map(c => (
                <ListItemCard
                  key={c.cropId}
                  title={c.cropName}
                  subtitle={c.zameenName}
                  meta={compactCurrency(c.netProfit)}
                  metaColor={
                    c.netProfit >= 0 ? theme.colors.income : theme.colors.expense
                  }
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Legend({color, label}: {color: string; label: string}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, {backgroundColor: color}]} />
      <AppText variant="caption" color={theme.colors.textMuted}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {padding: theme.spacing.xl, paddingBottom: theme.spacing.huge},
  title: {marginBottom: theme.spacing.lg},
  skel: {marginBottom: theme.spacing.lg},
  tiles: {flexDirection: 'row', gap: theme.spacing.md},
  netTile: {marginTop: theme.spacing.md, flex: 0},
  chartCard: {marginTop: theme.spacing.lg, marginBottom: theme.spacing.xl},
  chartHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  legend: {flexDirection: 'row', gap: theme.spacing.md},
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  legendDot: {width: 8, height: 8, borderRadius: 4},
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 24,
  },
  barGroup: {flex: 1, alignItems: 'center', gap: 8},
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: CHART_HEIGHT,
  },
  bar: {width: 9, borderRadius: 4},
  noData: {paddingVertical: theme.spacing.xl},
});
