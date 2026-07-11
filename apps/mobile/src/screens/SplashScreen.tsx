import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {Sprout} from 'lucide-react-native';
import {theme} from '../theme';
import {AppText} from '../components/AppText';

export function SplashScreen() {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.12, {duration: 1000, easing: Easing.inOut(Easing.ease)}),
      -1,
      true,
    );
    glow.value = withRepeat(
      withTiming(1, {duration: 1000, easing: Easing.inOut(Easing.ease)}),
      -1,
      true,
    );
  }, [glow, scale]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: glow.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logo, logoStyle]}>
        <Sprout color={theme.colors.primaryBright} size={54} strokeWidth={2.2} />
      </Animated.View>
      <AppText variant="h2" style={styles.title}>
        Zamindar Plus
      </AppText>
      <AppText variant="small" color={theme.colors.textMuted}>
        Your farm, in perfect order
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 108,
    height: 108,
    borderRadius: 32,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {marginBottom: 4},
});
