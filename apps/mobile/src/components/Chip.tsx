import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {theme} from '../theme';
import {haptics} from '../haptics';
import {AppText} from './AppText';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
};

export function Chip({label, selected, onPress, icon}: Props) {
  return (
    <Pressable
      onPress={() => {
        haptics.selection();
        onPress?.();
      }}
      style={[
        styles.chip,
        selected ? styles.selected : styles.unselected,
      ]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <AppText
        variant="small"
        color={selected ? theme.colors.onPrimary : theme.colors.textSecondary}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    height: 38,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  selected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  unselected: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
  },
  icon: {marginRight: 6},
});
