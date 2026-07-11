import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {Sprout} from 'lucide-react-native';
import {theme} from '../theme';
import {AppText} from '../components/AppText';
import {Gradient} from '../components/Gradient';

export function SplashScreen() {
  const scale = useSharedValue(0.9);
  const glow = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1, {duration: 1100, easing: Easing.inOut(Easing.ease)}),
      -1,
      true,
    );
    glow.value = withRepeat(
      withTiming(1, {duration: 1100, easing: Easing.inOut(Easing.ease)}),
      -1,
      true,
    );
  }, [glow, scale]);

  const markStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));
  const glowStyle = useAnimatedStyle(() => ({opacity: 0.25 + glow.value * 0.4}));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, glowStyle]} />
      <Animated.View style={markStyle}>
        <Gradient colors={theme.gradients.brand} borderRadius={18} style={styles.mark}>
          <Sprout color="#FFFFFF" size={42} strokeWidth={2.4} />
        </Gradient>
      </Animated.View>
      <AppText variant="h1" style={styles.title}>
        Zamindar Plus
      </AppText>
      <AppText variant="small" color={theme.colors.textSecondary}>
        Your farm, in perfect order
      </AppText>
      <View style={styles.dots}>
        <Dot index={0} />
        <Dot index={1} />
        <Dot index={2} />
      </View>
    </View>
  );
}

function Dot({index}: {index: number}) {
  const v = useSharedValue(0.3);
  useEffect(() => {
    v.value = withDelay(
      index * 180,
      withRepeat(withTiming(1, {duration: 540, easing: Easing.inOut(Easing.ease)}), -1, true),
    );
  }, [index, v]);
  const style = useAnimatedStyle(() => ({opacity: v.value, transform: [{scale: 0.8 + v.value * 0.3}]}));
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: theme.palette.greenSoft,
    top: '32%',
  },
  mark: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
    ...theme.shadow.brand,
  },
  title: {marginBottom: 4},
  dots: {flexDirection: 'row', gap: 8, marginTop: theme.spacing.xxl},
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
});
