import React from 'react';
import {StyleSheet, View} from 'react-native';
import {theme} from '../theme';
import {AppText} from './AppText';
import {Button} from './Button';

type Props = {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'error';
};

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  tone = 'neutral',
}: Props) {
  return (
    <View style={styles.container}>
      {icon ? (
        <View
          style={[
            styles.iconWrap,
            tone === 'error' && {borderColor: theme.colors.danger},
          ]}>
          {icon}
        </View>
      ) : null}
      <AppText variant="h3" center>
        {title}
      </AppText>
      {message ? (
        <AppText
          variant="body"
          color={theme.colors.textSecondary}
          center
          style={styles.message}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          fullWidth={false}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.huge,
    paddingHorizontal: theme.spacing.xl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  message: {marginTop: theme.spacing.sm, maxWidth: 300},
  action: {marginTop: theme.spacing.xl, paddingHorizontal: theme.spacing.xxl},
});
