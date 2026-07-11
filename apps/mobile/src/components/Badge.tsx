import React from 'react';
import {StyleSheet, View} from 'react-native';
import {theme} from '../theme';
import {AppText} from './AppText';

type Tone = 'income' | 'expense' | 'neutral' | 'accent' | 'primary';

type Props = {
  label: string;
  tone?: Tone;
};

const toneStyles: Record<Tone, {bg: string; fg: string}> = {
  income: {bg: 'rgba(47,191,113,0.16)', fg: theme.colors.income},
  expense: {bg: 'rgba(233,87,63,0.16)', fg: theme.colors.expense},
  accent: {bg: 'rgba(232,184,75,0.16)', fg: theme.colors.accent},
  primary: {bg: 'rgba(18,164,107,0.16)', fg: theme.colors.primaryBright},
  neutral: {bg: theme.colors.surfaceAlt, fg: theme.colors.textSecondary},
};

/** Maps common backend status strings to a tone. */
export function toneForStatus(status?: string | null): Tone {
  const s = (status ?? '').toLowerCase();
  if (['paid', 'active', 'growing'].includes(s)) {
    return 'income';
  }
  if (['unpaid', 'pending'].includes(s)) {
    return 'accent';
  }
  if (['harvested', 'sold', 'completed'].includes(s)) {
    return 'primary';
  }
  return 'neutral';
}

export function Badge({label, tone = 'neutral'}: Props) {
  const {bg, fg} = toneStyles[tone];
  return (
    <View style={[styles.badge, {backgroundColor: bg}]}>
      <AppText variant="caption" color={fg}>
        {label.toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
});
