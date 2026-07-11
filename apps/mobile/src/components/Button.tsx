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
import {Gradient} from './Gradient';

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
  const v = variants[variant];
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      disabled={isDisabled}
      onPressIn={() => {
        scale.value = withTiming(0.97, {duration: 90});
      }}
      onPressOut={() => {
        scale.value = withTiming(1, {duration: 150});
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
          !isPrimary && {backgroundColor: v.bg, borderColor: v.border},
          isPrimary && theme.shadow.brand,
          isDisabled && styles.disabled,
          animatedStyle,
          style,
        ]}>
        {isPrimary ? (
          <Gradient
            colors={theme.gradients.primary}
            style={StyleSheet.absoluteFill}
            borderRadius={theme.radius.md}
          />
        ) : null}
        {loading ? (
          <ActivityIndicator color={v.text} />
        ) : (
          <View style={styles.content}>
            {icon}
            <AppText variant="bodyStrong" color={v.text} style={styles.label}>
              {title}
            </AppText>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const variants: Record<Variant, {bg: string; text: string; border: string}> = {
  primary: {bg: 'transparent', text: '#FFFFFF', border: 'transparent'},
  secondary: {
    bg: theme.colors.softStrong,
    text: theme.colors.primary,
    border: theme.colors.border,
  },
  ghost: {bg: 'transparent', text: theme.colors.primary, border: 'transparent'},
  danger: {
    bg: theme.palette.roseSoft,
    text: theme.colors.dangerInk,
    border: 'rgba(184,68,85,0.32)',
  },
};

const styles = StyleSheet.create({
  full: {width: '100%'},
  base: {
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  md: {height: 46, paddingHorizontal: theme.spacing.lg},
  lg: {height: 52, paddingHorizontal: theme.spacing.xl},
  content: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm},
  label: {fontWeight: '800'},
  disabled: {opacity: 0.55},
});
