import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {ArrowLeft} from 'lucide-react-native';
import {theme} from '../theme';
import {haptics} from '../haptics';
import {AppText} from './AppText';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export function DetailHeader({title, subtitle, onBack, right}: Props) {
  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable
          onPress={() => {
            haptics.selection();
            onBack();
          }}
          hitSlop={10}
          style={styles.back}>
          <ArrowLeft color={theme.colors.text} size={22} />
        </Pressable>
      ) : null}
      <View style={styles.titles}>
        <AppText variant="h2" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="small" color={theme.colors.textMuted} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  titles: {flex: 1},
  right: {marginLeft: theme.spacing.sm},
});
