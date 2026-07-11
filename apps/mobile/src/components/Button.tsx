import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {theme} from '../theme';
import {haptics} from '../haptics';
import {AppText} from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading,
  disabled,
  icon,
  fullWidth = true,
  style,
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const isDisabled = disabled || loading;
  const palette = variantStyles[variant];

  return (
    <Pressable
      disabled={isDisabled}
      onPressIn={() => {
        scale.value = withTiming(0.97, {duration: 90});
      }}
      onPressOut={() => {
        scale.value = withTiming(1, {duration: 140});
      }}
      onPress={() => {
        haptics.light();
        onPress?.();
      }}
      style={fullWidth ? styles.full : undefined}>
      <Animated.View
        style={[
          styles.base,
          size === 'lg' ? styles.lg : styles.md,
          {backgroundColor: palette.bg, borderColor: palette.border},
          isDisabled && styles.disabled,
          animatedStyle,
          style,
        ]}>
        {loading ? (
          <ActivityIndicator color={palette.text} />
        ) : (
          <View style={styles.content}>
            {icon}
            <AppText variant="bodyStrong" color={palette.text}>
              {title}
            </AppText>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const variantStyles: Record<
  Variant,
  {bg: string; text: string; border: string}
> = {
  primary: {
    bg: theme.colors.primary,
    text: theme.colors.onPrimary,
    border: theme.colors.primary,
  },
  secondary: {
    bg: theme.colors.cardElevated,
    text: theme.colors.text,
    border: theme.colors.border,
  },
  ghost: {
    bg: 'transparent',
    text: theme.colors.text,
    border: 'transparent',
  },
  danger: {
    bg: theme.colors.danger,
    text: '#FFFFFF',
    border: theme.colors.danger,
  },
};

const styles = StyleSheet.create({
  full: {width: '100%'},
  base: {
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  md: {height: 46, paddingHorizontal: theme.spacing.lg},
  lg: {height: 54, paddingHorizontal: theme.spacing.xl},
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  disabled: {opacity: 0.5},
});
