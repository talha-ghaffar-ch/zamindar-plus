import React, {useEffect} from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {theme} from '../theme';
import {AppText} from './AppText';

export type MetricTone =
  | 'income'
  | 'expense'
  | 'profit'
  | 'land'
  | 'crop'
  | 'activity';

const toneColor: Record<MetricTone, string> = {
  income: theme.colors.income,
  expense: theme.colors.expense,
  profit: theme.colors.profit,
  land: theme.colors.land,
  crop: theme.colors.crop,
  activity: theme.colors.activity,
};

const toneSoft: Record<MetricTone, string> = {
  income: theme.palette.greenSoft,
  expense: theme.palette.roseSoft,
  profit: theme.palette.cyanSoft,
  land: theme.palette.amberSoft,
  crop: theme.palette.blueSoft,
  activity: theme.palette.violetSoft,
};

type Props = {
  label: string;
  value: string;
  hint: string;
  tone: MetricTone;
  icon: React.ReactNode;
  level: number; // 0..1
  style?: StyleProp<ViewStyle>;
};

export function MetricCard({label, value, hint, tone, icon, level, style}: Props) {
  const color = toneColor[tone];
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withTiming(Math.max(0.06, Math.min(1, level)), {duration: 760});
  }, [level, fill]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));

  return (
    <View style={[styles.card, {backgroundColor: toneSoft[tone]}, theme.shadow.soft, style]}>
      <View style={[styles.accent, {backgroundColor: color}]} />
      <View style={styles.header}>
        <AppText variant="label" color={theme.colors.textSecondary}>
          {label.toUpperCase()}
        </AppText>
        {icon}
      </View>
      <AppText variant="h2" numberOfLines={1} style={styles.value}>
        {value}
      </AppText>
      <AppText variant="caption" color={theme.colors.textMuted} numberOfLines={1}>
        {hint}
      </AppText>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, {backgroundColor: color}, barStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    padding: theme.spacing.lg,
    overflow: 'hidden',
  },
  accent: {position: 'absolute', top: 0, left: 0, right: 0, height: 3},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  value: {marginBottom: 2},
  track: {
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(16,33,29,0.06)',
    marginTop: theme.spacing.md,
    overflow: 'hidden',
  },
  fill: {height: '100%', borderRadius: 999},
});
