import React from 'react';
import {StyleSheet, View} from 'react-native';
import {ChevronRight} from 'lucide-react-native';
import {theme} from '../theme';
import {Card} from './Card';
import {AppText} from './AppText';

type Props = {
  title: string;
  subtitle?: string;
  meta?: string;
  metaColor?: string;
  badge?: React.ReactNode;
  leading?: React.ReactNode;
  onPress?: () => void;
};

export function ListItemCard({
  title,
  subtitle,
  meta,
  metaColor,
  badge,
  leading,
  onPress,
}: Props) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <View style={styles.main}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="small" color={theme.colors.textMuted} numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
          {badge ? <View style={styles.badge}>{badge}</View> : null}
        </View>
        <View style={styles.right}>
          {meta ? (
            <AppText variant="bodyStrong" color={metaColor ?? theme.colors.text}>
              {meta}
            </AppText>
          ) : null}
          {onPress ? (
            <ChevronRight color={theme.colors.textMuted} size={18} />
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {marginBottom: theme.spacing.md},
  row: {flexDirection: 'row', alignItems: 'center'},
  leading: {marginRight: theme.spacing.md},
  main: {flex: 1, marginRight: theme.spacing.md},
  badge: {marginTop: theme.spacing.sm, alignSelf: 'flex-start'},
  right: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flexShrink: 0},
});
