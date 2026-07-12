import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {theme} from '../theme';
import {haptics} from '../haptics';
import {AppText} from './AppText';
import {Gradient} from './Gradient';

type Props = {
  title: string;
  onPress: () => void;
  /** Form is valid — the button "lights up" (vibrant gradient + glow + sheen). */
  ready: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const HEIGHT = 54;

/**
 * Primary auth CTA that mirrors the website's `.auth-submit-button.is-ready`
 * state: while the form is incomplete it stays calm and dim; the moment the
 * required fields are valid it brightens to a green -> cyan -> amber gradient,
 * pulses a soft glow, and sweeps a light sheen across itself.
 */
export function AuthSubmitButton({
  title,
  onPress,
  ready,
  loading,
  disabled,
  icon,
  style,
}: Props) {
  const [width, setWidth] = useState(0);
  const press = useSharedValue(1);
  const readyV = useSharedValue(ready ? 1 : 0);
  const pulse = useSharedValue(0);
  const sheen = useSharedValue(0);

  useEffect(() => {
    readyV.value = withTiming(ready ? 1 : 0, {duration: 280});
    if (ready && !loading) {
      pulse.value = withRepeat(
        withTiming(1, {duration: 1600, easing: Easing.inOut(Easing.ease)}),
        -1,
        true,
      );
      sheen.value = withRepeat(
        withTiming(1, {duration: 1900, easing: Easing.inOut(Easing.ease)}),
        -1,
        false,
      );
    } else {
      cancelAnimation(pulse);
      cancelAnimation(sheen);
      pulse.value = withTiming(0, {duration: 220});
      sheen.value = 0;
    }
  }, [ready, loading, pulse, sheen, readyV]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: (disabled ? 0.5 : 0.72) + readyV.value * 0.28,
    transform: [{scale: press.value}, {translateY: -pulse.value * 1.5}],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: readyV.value * (0.2 + pulse.value * 0.3),
    transform: [{scale: 1 + pulse.value * 0.05}],
  }));
  const sheenStyle = useAnimatedStyle(() => ({
    opacity: readyV.value,
    transform: [
      {translateX: -width * 0.6 + sheen.value * width * 1.4},
      {skewX: '-18deg'},
    ],
  }));

  const isDisabled = disabled || loading;

  return (
    <View style={[styles.outer, style]}>
      <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />
      <Pressable
        disabled={isDisabled}
        onPressIn={() => {
          press.value = withTiming(0.97, {duration: 90});
        }}
        onPressOut={() => {
          press.value = withTiming(1, {duration: 150});
        }}
        onPress={() => {
          haptics.light();
          onPress();
        }}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        <Animated.View style={[styles.body, wrapStyle]}>
          <Gradient
            colors={ready ? theme.gradients.ready : theme.gradients.primary}
            style={StyleSheet.absoluteFill}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            borderRadius={theme.radius.md}
          />
          <Animated.View
            style={[styles.sheen, sheenStyle]}
            pointerEvents="none"
          />
          <View style={styles.content}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              icon ?? null
            )}
            <AppText variant="bodyStrong" color="#FFFFFF" style={styles.label}>
              {title}
            </AppText>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {width: '100%'},
  glow: {
    position: 'absolute',
    left: -6,
    right: -6,
    top: -6,
    bottom: -6,
    borderRadius: theme.radius.md + 8,
    backgroundColor: theme.palette.cyan,
  },
  body: {
    height: HEIGHT,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...theme.shadow.brand,
  },
  sheen: {
    position: 'absolute',
    top: -HEIGHT,
    bottom: -HEIGHT,
    width: 64,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  label: {fontWeight: '800'},
});
