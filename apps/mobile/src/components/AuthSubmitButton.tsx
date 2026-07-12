import React, {useEffect, useId, useState} from 'react';
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
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import {theme} from '../theme';
import {haptics} from '../haptics';
import {AppText} from './AppText';
import {Gradient} from './Gradient';

type Props = {
  title: string;
  onPress: () => void;
  /** Form is valid — the button "lights up" like the website's is-ready state. */
  ready: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const HEIGHT = 54;

/**
 * Primary auth CTA mirroring the website's `.auth-submit-button.is-ready`:
 * a calm green->cyan button that, when the form validates, crossfades to a
 * green->cyan->amber gradient, breathes a soft (borderless) glow, and sweeps a
 * gentle light sheen across itself.
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
  const glow = useSharedValue(0);
  const sheen = useSharedValue(0);
  const rawId = useId();
  const gid = `sheen${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

  useEffect(() => {
    readyV.value = withTiming(ready ? 1 : 0, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    });
    if (ready && !loading) {
      glow.value = withRepeat(
        withTiming(1, {duration: 1800, easing: Easing.inOut(Easing.quad)}),
        -1,
        true,
      );
      sheen.value = withDelay(
        500,
        withRepeat(
          withTiming(1, {duration: 1500, easing: Easing.inOut(Easing.ease)}),
          -1,
          false,
        ),
      );
    } else {
      cancelAnimation(glow);
      cancelAnimation(sheen);
      glow.value = withTiming(0, {duration: 300});
      sheen.value = 0;
    }
  }, [ready, loading, glow, sheen, readyV]);

  const liftStyle = useAnimatedStyle(() => ({
    transform: [
      {scale: press.value},
      {translateY: -(readyV.value + glow.value)},
    ],
  }));
  const readyGradientStyle = useAnimatedStyle(() => ({opacity: readyV.value}));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: readyV.value * (0.06 + glow.value * 0.1),
  }));
  const sheenStyle = useAnimatedStyle(() => ({
    opacity: readyV.value,
    transform: [
      {translateX: -100 + sheen.value * (width + 200)},
      {skewX: '-20deg'},
    ],
  }));

  const isDisabled = disabled || loading;

  return (
    <View style={[styles.outer, style]}>
      <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />
      <Pressable
        disabled={isDisabled}
        onPressIn={() => {
          press.value = withTiming(0.98, {duration: 100});
        }}
        onPressOut={() => {
          press.value = withTiming(1, {duration: 160});
        }}
        onPress={() => {
          haptics.light();
          onPress();
        }}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        <Animated.View style={[styles.body, liftStyle]}>
          <Gradient
            colors={theme.gradients.primary}
            style={StyleSheet.absoluteFill}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            borderRadius={theme.radius.md}
          />
          <Animated.View style={[StyleSheet.absoluteFill, readyGradientStyle]}>
            <Gradient
              colors={theme.gradients.ready}
              style={StyleSheet.absoluteFill}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              borderRadius={theme.radius.md}
            />
          </Animated.View>

          {width > 0 ? (
            <Animated.View style={[styles.sheen, sheenStyle]} pointerEvents="none">
              <Svg style={StyleSheet.absoluteFill}>
                <Defs>
                  <SvgLinearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#ffffff" stopOpacity={0} />
                    <Stop offset="0.5" stopColor="#ffffff" stopOpacity={0.5} />
                    <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
                  </SvgLinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gid})`} />
              </Svg>
            </Animated.View>
          ) : null}

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
  // Soft, low-opacity halo that fakes a downward glow (no hard border edge).
  glow: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 14,
    bottom: -10,
    borderRadius: theme.radius.lg,
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
  sheen: {position: 'absolute', top: -HEIGHT, bottom: -HEIGHT, width: 88},
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  label: {fontWeight: '800'},
});
