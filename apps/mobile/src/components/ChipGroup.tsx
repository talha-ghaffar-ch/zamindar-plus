import React from 'react';
import {StyleSheet, View} from 'react-native';
import {theme} from '../theme';
import {AppText} from './AppText';
import {Chip} from './Chip';

type Props = {
  label?: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
};

export function ChipGroup({label, options, value, onChange}: Props) {
  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="small" color={theme.colors.textSecondary} style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View style={styles.row}>
        {options.map(option => (
          <Chip
            key={option}
            label={option}
            selected={option === value}
            onPress={() => onChange(option)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {width: '100%'},
  label: {marginBottom: 8, marginLeft: 2},
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
});
