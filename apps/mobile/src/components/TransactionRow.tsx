import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {ArrowDownLeft, ArrowUpRight} from 'lucide-react-native';
import {theme} from '../theme';
import {formatCurrency, formatDate} from '../format';
import {AppText} from './AppText';
import {haptics} from '../haptics';

type Props = {
  title: string;
  subtitle?: string;
  amount: number;
  tone: 'income' | 'expense';
  date: string;
  onPress?: () => void;
  onLongPress?: () => void;
};

export function TransactionRow({
  title,
  subtitle,
  amount,
  tone,
  date,
  onPress,
  onLongPress,
}: Props) {
  const color = tone === 'income' ? theme.colors.income : theme.colors.expense;
  const sign = tone === 'income' ? '+' : '−';

  const body = (
    <View style={styles.row}>
      <View style={[styles.iconDot, {backgroundColor: `${color}22`}]}>
        {tone === 'income' ? (
          <ArrowDownLeft color={color} size={18} />
        ) : (
          <ArrowUpRight color={color} size={18} />
        )}
      </View>
      <View style={styles.middle}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="small" color={theme.colors.textMuted} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={styles.right}>
        <AppText variant="bodyStrong" color={color}>
          {sign} {formatCurrency(amount)}
        </AppText>
        <AppText variant="small" color={theme.colors.textMuted}>
          {formatDate(date)}
        </AppText>
      </View>
    </View>
  );

  if (!onPress && !onLongPress) {
    return body;
  }
  return (
    <Pressable
      onPress={
        onPress
          ? () => {
              haptics.selection();
              onPress();
            }
          : undefined
      }
      onLongPress={
        onLongPress
          ? () => {
              haptics.medium();
              onLongPress();
            }
          : undefined
      }>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  iconDot: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  middle: {flex: 1, marginRight: theme.spacing.sm},
  right: {alignItems: 'flex-end'},
});
