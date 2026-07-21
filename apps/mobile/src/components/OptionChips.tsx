import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useI18n} from '../i18n/useT';
import {theme} from '../theme';
import {AppText} from './AppText';
import {Chip} from './Chip';

export type Option = {label: string; value: string};

type Props = {
  label?: string;
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
  emptyText?: string;
};

export function OptionChips({label, options, value, onChange, emptyText}: Props) {
  const {t} = useI18n();
  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="small" color={theme.colors.textSecondary} style={styles.label}>
          {label}
        </AppText>
      ) : null}
      {options.length === 0 ? (
        <AppText variant="small" color={theme.colors.textMuted}>
          {emptyText ?? t('mobile.noOptions')}
        </AppText>
      ) : (
        <View style={styles.row}>
          {options.map(option => (
            <Chip
              key={option.value}
              label={option.label}
              selected={option.value === value}
              onPress={() => onChange(option.value)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {width: '100%'},
  label: {marginBottom: 8, marginLeft: 2},
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
});
