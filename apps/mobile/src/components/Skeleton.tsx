import React, {useEffect} from 'react';
import {DimensionValue, StyleProp, ViewStyle} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {theme} from '../theme';

type Props = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({width = '100%', height = 16, radius = 8, style}: Props) {
  const shimmer = useSharedValue(0.4);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(0.85, {duration: 800, easing: Easing.inOut(Easing.ease)}),
      -1,
      true,
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({opacity: shimmer.value}));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: theme.colors.softStrong,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
