import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {theme} from '../theme';
import {AppText} from './AppText';

type Tone = 'income' | 'expense' | 'neutral' | 'accent';

type Props = {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
};

const toneColor: Record<Tone, string> = {
  income: theme.colors.income,
  expense: theme.colors.expense,
  neutral: theme.colors.text,
  accent: theme.colors.accent,
};

export function StatTile({label, value, icon, tone = 'neutral', style}: Props) {
  const color = toneColor[tone];
  return (
    <View style={[styles.tile, style]}>
      <View style={styles.top}>
        <AppText variant="caption" color={theme.colors.textMuted}>
          {label.toUpperCase()}
        </AppText>
        {icon}
      </View>
      <AppText variant="numeric" color={color} style={styles.value} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    minHeight: 92,
    justifyContent: 'space-between',
  },
  top: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  value: {marginTop: theme.spacing.md},
});
