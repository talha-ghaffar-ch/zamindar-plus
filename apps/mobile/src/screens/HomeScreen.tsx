import React, {useMemo} from 'react';
import {Pressable, RefreshControl, ScrollView, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {ArrowDownLeft, ArrowUpRight, Sprout, TrendingUp, Wallet} from 'lucide-react-native';
import {Screen} from '../components/Screen';
import {AppText} from '../components/AppText';
import {Card} from '../components/Card';
import {StatTile} from '../components/StatTile';
import {SectionHeader} from '../components/SectionHeader';
import {Skeleton} from '../components/Skeleton';
import {EmptyState} from '../components/EmptyState';
import {TransactionRow} from '../components/TransactionRow';
import {useAuth} from '../context/AuthContext';
import {useFarmData} from '../context/FarmDataContext';
import {theme} from '../theme';
import {compactCurrency, formatCurrency, initialsOf} from '../format';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const {user} = useAuth();
  const {data, status, error, refreshing, refresh, reload} = useFarmData();

  const recent = useMemo(() => {
    if (!data) {
      return [];
    }
    const expenses = data.expenses.map(e => ({
      id: `e-${e.id}`,
      kind: 'expense' as const,
      title: e.expenseCategory,
      subtitle: e.description,
      amount: e.amount,
      date: e.expenseDate,
    }));
    const income = data.income.map(i => ({
      id: `i-${i.id}`,
      kind: 'income' as const,
      title: i.buyerName || 'Crop sale',
      subtitle:
        i.quantity != null ? `${i.quantity} ${i.quantityUnit ?? ''}`.trim() : undefined,
      amount: i.totalAmount,
      date: i.incomeDate,
    }));
    return [...expenses, ...income]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [data]);

  const summary = data?.summary;

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
        <View style={styles.header}>
          <View style={styles.flex}>
            <AppText variant="small" color={theme.colors.textMuted}>
              ASSALAM-O-ALAIKUM
            </AppText>
            <AppText variant="h1" numberOfLines={1}>
              {user?.firstName ?? 'Farmer'}
            </AppText>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            style={styles.avatar}>
            <AppText variant="bodyStrong" color={theme.colors.primaryBright}>
              {initialsOf(user?.firstName, user?.lastName)}
            </AppText>
          </Pressable>
        </View>

        {status === 'loading' ? (
          <DashboardSkeleton />
        ) : status === 'error' ? (
          <EmptyState
            tone="error"
            icon={<Wallet color={theme.colors.danger} size={26} />}
            title="Couldn't load your farm"
            message={error ?? 'Something went wrong.'}
            actionLabel="Try again"
            onAction={reload}
          />
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(400)}>
              <Card elevated style={styles.hero}>
                <View style={styles.heroTop}>
                  <AppText variant="caption" color={theme.colors.textMuted}>
                    NET PROFIT
                  </AppText>
                  <View style={styles.trendPill}>
                    <TrendingUp color={theme.colors.primaryBright} size={14} />
                    <AppText variant="caption" color={theme.colors.primaryBright}>
                      SEASON
                    </AppText>
                  </View>
                </View>
                <AppText
                  variant="display"
                  color={
                    (summary?.netProfit ?? 0) >= 0
                      ? theme.colors.income
                      : theme.colors.expense
                  }
                  style={styles.heroValue}>
                  {formatCurrency(summary?.netProfit ?? 0)}
                </AppText>
                <View style={styles.heroSplit}>
                  <View style={styles.heroSplitItem}>
                    <ArrowDownLeft color={theme.colors.income} size={16} />
                    <AppText variant="small" color={theme.colors.textSecondary}>
                      Income {compactCurrency(summary?.totalIncome ?? 0)}
                    </AppText>
                  </View>
                  <View style={styles.heroSplitItem}>
                    <ArrowUpRight color={theme.colors.expense} size={16} />
                    <AppText variant="small" color={theme.colors.textSecondary}>
                      Spent {compactCurrency(summary?.totalExpense ?? 0)}
                    </AppText>
                  </View>
                </View>
              </Card>
            </Animated.View>

            <View style={styles.tiles}>
              <StatTile
                label="Zameen"
                value={`${summary?.zameenCount ?? 0}`}
                tone="accent"
                icon={<Sprout color={theme.colors.accent} size={16} />}
              />
              <StatTile
                label="Crops"
                value={`${summary?.cropCount ?? 0}`}
                tone="neutral"
                icon={<Sprout color={theme.colors.primaryBright} size={16} />}
              />
            </View>

            <View style={styles.recent}>
              <SectionHeader title="Recent activity" />
              {recent.length === 0 ? (
                <Card>
                  <AppText variant="body" color={theme.colors.textSecondary} center>
                    No records yet. Add your first expense or income to see it here.
                  </AppText>
                </Card>
              ) : (
                <Card>
                  {recent.map((item, index) => (
                    <View key={item.id}>
                      {index > 0 ? <View style={styles.divider} /> : null}
                      <TransactionRow
                        title={item.title}
                        subtitle={item.subtitle}
                        amount={item.amount}
                        tone={item.kind}
                        date={item.date}
                      />
                    </View>
                  ))}
                </Card>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function DashboardSkeleton() {
  return (
    <View>
      <Skeleton height={150} radius={20} />
      <View style={styles.tiles}>
        <Skeleton height={92} radius={20} style={styles.flex} />
        <Skeleton height={92} radius={20} style={styles.flex} />
      </View>
      <Skeleton height={20} width={160} style={styles.skelHeader} />
      <Skeleton height={220} radius={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {padding: theme.spacing.xl, paddingBottom: theme.spacing.huge},
  flex: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {marginBottom: theme.spacing.lg},
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(18,164,107,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  heroValue: {marginTop: theme.spacing.md, marginBottom: theme.spacing.lg},
  heroSplit: {flexDirection: 'row', gap: theme.spacing.xl},
  heroSplitItem: {flexDirection: 'row', alignItems: 'center', gap: 6},
  tiles: {flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.lg},
  recent: {marginTop: theme.spacing.sm},
  divider: {height: 1, backgroundColor: theme.colors.hairline},
  skelHeader: {marginTop: theme.spacing.xl, marginBottom: theme.spacing.md},
});
