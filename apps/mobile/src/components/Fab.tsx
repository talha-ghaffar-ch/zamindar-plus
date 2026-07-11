import React from 'react';
import {Pressable, StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {theme} from '../theme';
import {haptics} from '../haptics';

type Props = {
  onPress: () => void;
  icon: React.ReactNode;
  bottom?: number;
};

export function Fab({onPress, icon, bottom = 24}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withTiming(0.9, {duration: 90});
      }}
      onPressOut={() => {
        scale.value = withTiming(1, {duration: 160});
      }}
      onPress={() => {
        haptics.medium();
        onPress();
      }}
      style={[styles.wrap, {bottom}]}>
      <Animated.View style={[styles.fab, theme.shadow.glow, animatedStyle]}>
        {icon}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {position: 'absolute', right: 20},
  fab: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
