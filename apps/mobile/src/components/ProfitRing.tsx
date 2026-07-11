import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Circle, Defs, LinearGradient, Stop} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {theme} from '../theme';
import {AppText} from './AppText';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  percent: number;
  centerLabel: string;
  caption: string;
  size?: number;
  stroke?: number;
};

export function ProfitRing({
  percent,
  centerLabel,
  caption,
  size = 132,
  stroke = 13,
}: Props) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = useSharedValue(0);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(100, percent)) / 100;
    progress.value = withTiming(clamped, {
      duration: 1100,
      easing: Easing.out(Easing.cubic),
    });
  }, [percent, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={{width: size, height: size}}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="profitRing" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={theme.palette.greenBright} />
            <Stop offset="0.55" stopColor={theme.palette.cyan} />
            <Stop offset="1" stopColor={theme.palette.amber} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={theme.palette.softStrong}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#profitRing)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <AppText variant="h1">{centerLabel}</AppText>
        <AppText variant="label" color={theme.colors.textMuted}>
          {caption.toUpperCase()}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
