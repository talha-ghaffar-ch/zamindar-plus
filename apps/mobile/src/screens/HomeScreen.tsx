import React, {useMemo} from 'react';
import {Pressable, RefreshControl, ScrollView, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Layers,
  MapPin,
  Sparkles,
  Sprout,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import {Screen} from '../components/Screen';
import {AppText} from '../components/AppText';
import {Card} from '../components/Card';
import {Gradient} from '../components/Gradient';
import {ProfitRing} from '../components/ProfitRing';
import {MetricCard, MetricTone} from '../components/MetricCard';
import {Skeleton} from '../components/Skeleton';
import {EmptyState} from '../components/EmptyState';
import {SectionHeader} from '../components/SectionHeader';
import {useAuth} from '../context/AuthContext';
import {useFarmData} from '../context/FarmDataContext';
import {theme} from '../theme';
import {haptics} from '../haptics';
import {compactCurrency, formatCurrency, initialsOf, monthName} from '../format';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const {user} = useAuth();
  const {data, status, error, refreshing, refresh, reload} = useFarmData();
  const s = data?.summary;

  const totalMove = (s?.totalExpense ?? 0) + (s?.totalIncome ?? 0);
  const profitMargin =
    s && s.totalIncome > 0 ? Math.round((s.netProfit / s.totalIncome) * 100) : 0;
  const expenseShare =
    totalMove > 0 ? Math.round(((s?.totalExpense ?? 0) / totalMove) * 100) : 0;
  const maxMoney = Math.max(
    s?.totalExpense ?? 0,
    s?.totalIncome ?? 0,
    Math.abs(s?.netProfit ?? 0),
    1,
  );
  const entries = (s?.expenseCount ?? 0) + (s?.incomeCount ?? 0);

  const months = useMemo(
    () =>
      (data?.monthlyReports ?? [])
        .slice()
        .sort((a, b) => a.year - b.year || a.month - b.month)
        .slice(-6),
    [data],
  );
  const maxMonth = Math.max(1, ...months.flatMap(m => [m.totalIncome, m.totalExpense]));

  const metrics: {
    label: string;
    value: string;
    hint: string;
    tone: MetricTone;
    icon: React.ReactNode;
    level: number;
  }[] = [
    {
      label: 'Expense',
      value: compactCurrency(s?.totalExpense ?? 0),
      hint: `${expenseShare}% of movement`,
      tone: 'expense',
      icon: <TrendingDown color={theme.colors.expense} size={18} />,
      level: (s?.totalExpense ?? 0) / maxMoney,
    },
    {
      label: 'Income',
      value: compactCurrency(s?.totalIncome ?? 0),
      hint: 'Received',
      tone: 'income',
      icon: <TrendingUp color={theme.colors.income} size={18} />,
      level: (s?.totalIncome ?? 0) / maxMoney,
    },
    {
      label: 'Net profit',
      value: compactCurrency(s?.netProfit ?? 0),
      hint: `${profitMargin}% margin`,
      tone: 'profit',
      icon: <Wallet color={theme.colors.profit} size={18} />,
      level: Math.abs(s?.netProfit ?? 0) / maxMoney,
    },
    {
      label: 'Zameen',
      value: `${s?.zameenCount ?? 0}`,
      hint: 'Land records',
      tone: 'land',
      icon: <MapPin color={theme.colors.land} size={18} />,
      level: 0.55,
    },
    {
      label: 'Crops',
      value: `${s?.cropCount ?? 0}`,
      hint: 'Crop cycles',
      tone: 'crop',
      icon: <Sprout color={theme.colors.crop} size={18} />,
      level: 0.55,
    },
    {
      label: 'Entries',
      value: `${entries}`,
      hint: 'Expense + income',
      tone: 'activity',
      icon: <Layers color={theme.colors.activity} size={18} />,
      level: 0.7,
    },
  ];

  const actions: {label: string; icon: React.ReactNode; go: () => void}[] = [
    {label: 'Add expense', icon: <TrendingDown color={theme.colors.expense} size={19} />, go: () => navigation.navigate('Add')},
    {label: 'Add income', icon: <TrendingUp color={theme.colors.income} size={19} />, go: () => navigation.navigate('Add')},
    {label: 'Add crop', icon: <Sprout color={theme.colors.crop} size={19} />, go: () => navigation.navigate('Add')},
    {label: 'Add zameen', icon: <MapPin color={theme.colors.land} size={19} />, go: () => navigation.navigate('Add')},
    {label: 'Reports', icon: <BarChart3 color={theme.colors.profit} size={19} />, go: () => navigation.navigate('Reports')},
    {label: 'Records', icon: <Layers color={theme.colors.primary} size={19} />, go: () => navigation.navigate('Records')},
  ];

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
        <View style={styles.header}>
          <View style={styles.flex}>
            <AppText variant="label" color={theme.colors.cyan}>
              DASHBOARD
            </AppText>
            <AppText variant="h1" style={styles.title}>
              Farm command center
            </AppText>
          </View>
          <Pressable onPress={() => navigation.navigate('Settings')} style={styles.avatar}>
            <AppText variant="bodyStrong" color={theme.colors.primary}>
              {initialsOf(user?.firstName, user?.lastName)}
            </AppText>
          </Pressable>
        </View>

        {status === 'loading' ? (
          <DashboardSkeleton />
        ) : status === 'error' ? (
          <EmptyState
            tone="error"
            title="Couldn't load your farm"
            message={error ?? 'Something went wrong.'}
            actionLabel="Try again"
            onAction={reload}
          />
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(420)}>
              <Card elevated style={styles.hero}>
                <View style={styles.heroLeft}>
                  <AppText variant="label" color={theme.colors.cyan}>
                    FINANCIAL PULSE
                  </AppText>
                  <AppText
                    variant="numeric"
                    color={(s?.netProfit ?? 0) >= 0 ? theme.colors.income : theme.colors.expense}
                    numberOfLines={1}
                    style={styles.heroValue}>
                    {formatCurrency(s?.netProfit ?? 0)}
                  </AppText>
                  <View style={styles.miniRow}>
                    <ArrowDownLeft color={theme.colors.income} size={15} />
                    <AppText variant="small" color={theme.colors.textSecondary}>
                      Income
                    </AppText>
                    <AppText variant="small" color={theme.colors.text}>
                      {compactCurrency(s?.totalIncome ?? 0)}
                    </AppText>
                  </View>
                  <View style={styles.miniRow}>
                    <ArrowUpRight color={theme.colors.expense} size={15} />
                    <AppText variant="small" color={theme.colors.textSecondary}>
                      Spent
                    </AppText>
                    <AppText variant="small" color={theme.colors.text}>
                      {compactCurrency(s?.totalExpense ?? 0)}
                    </AppText>
                  </View>
                </View>
                <ProfitRing percent={profitMargin} centerLabel={`${profitMargin}%`} caption="Margin" />
              </Card>
            </Animated.View>

            <View style={styles.grid}>
              {metrics.map((m, i) => (
                <Animated.View
                  key={m.label}
                  entering={FadeInDown.delay(70 + i * 45).duration(360)}
                  style={styles.gridItem}>
                  <MetricCard {...m} />
                </Animated.View>
              ))}
            </View>

            <SectionHeader title="Quick actions" />
            <View style={styles.actionsGrid}>
              {actions.map(a => (
                <Pressable
                  key={a.label}
                  style={styles.action}
                  onPress={() => {
                    haptics.selection();
                    a.go();
                  }}>
                  <View style={styles.actionIcon}>{a.icon}</View>
                  <AppText variant="small" center numberOfLines={1}>
                    {a.label}
                  </AppText>
                </Pressable>
              ))}
            </View>

            <SectionHeader title="Monthly movement" />
            <Card elevated style={styles.chartCard}>
              {months.length === 0 ? (
                <AppText variant="body" color={theme.colors.textSecondary} center style={styles.noData}>
                  Monthly data appears as you record income and expenses.
                </AppText>
              ) : (
                <>
                  <View style={styles.legend}>
                    <Legend color={theme.colors.income} label="Income" />
                    <Legend color={theme.colors.expense} label="Spent" />
                  </View>
                  <View style={styles.chart}>
                    {months.map(m => (
                      <View key={`${m.year}-${m.month}`} style={styles.barGroup}>
                        <View style={styles.bars}>
                          <View
                            style={[
                              styles.bar,
                              {
                                height: Math.max(3, (m.totalIncome / maxMonth) * 96),
                                backgroundColor: theme.colors.income,
                              },
                            ]}
                          />
                          <View
                            style={[
                              styles.bar,
                              {
                                height: Math.max(3, (m.totalExpense / maxMonth) * 96),
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
                </>
              )}
            </Card>

            <Pressable
              onPress={() => {
                haptics.medium();
                navigation.navigate('Assistant');
              }}
              style={styles.aiWrap}>
              <Gradient
                colors={theme.gradients.primary}
                borderRadius={theme.radius.lg}
                style={styles.ai}>
                <View style={styles.aiOrb}>
                  <Sparkles color="#FFFFFF" size={22} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="h3" color="#FFFFFF">
                    Zamindar AI
                  </AppText>
                  <AppText variant="small" color="rgba(255,255,255,0.85)">
                    Ask about your crops, costs & profit
                  </AppText>
                </View>
                <ArrowUpRight color="rgba(255,255,255,0.9)" size={20} />
              </Gradient>
            </Pressable>
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

function DashboardSkeleton() {
  return (
    <View>
      <Skeleton height={150} radius={12} />
      <View style={styles.grid}>
        <Skeleton height={104} radius={12} style={styles.gridItem} />
        <Skeleton height={104} radius={12} style={styles.gridItem} />
        <Skeleton height={104} radius={12} style={styles.gridItem} />
        <Skeleton height={104} radius={12} style={styles.gridItem} />
      </View>
      <Skeleton height={20} width={150} style={styles.skelHead} />
      <Skeleton height={180} radius={12} />
    </View>
  );
}

const GAP = theme.spacing.md;

const styles = StyleSheet.create({
  content: {padding: theme.spacing.xl, paddingBottom: theme.spacing.huge},
  flex: {flex: 1},
  header: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.xl},
  title: {marginTop: 4},
  avatar: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.softStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  heroLeft: {flex: 1, gap: 6},
  heroValue: {marginVertical: 4},
  miniRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginBottom: theme.spacing.sm},
  gridItem: {width: `${50}%`, flexBasis: '47%', flexGrow: 1},
  actionsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginBottom: theme.spacing.xl},
  action: {
    width: '30%',
    flexGrow: 1,
    minWidth: 96,
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.lg,
    ...theme.shadow.soft,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.softStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCard: {marginBottom: theme.spacing.xl},
  legend: {flexDirection: 'row', gap: theme.spacing.lg, marginBottom: theme.spacing.md},
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  legendDot: {width: 8, height: 8, borderRadius: 4},
  chart: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120},
  barGroup: {flex: 1, alignItems: 'center', gap: 8},
  bars: {flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 96},
  bar: {width: 9, borderRadius: 4},
  noData: {paddingVertical: theme.spacing.xl},
  aiWrap: {marginTop: theme.spacing.sm},
  ai: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    ...theme.shadow.brand,
  },
  aiOrb: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skelHead: {marginTop: theme.spacing.xl, marginBottom: theme.spacing.md},
});
