import React from 'react';
import {Pressable, StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {theme} from '../theme';
import {haptics} from '../haptics';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  elevated?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({children, onPress, elevated, padded = true, style}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const content = (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        elevated ? theme.shadow.card : theme.shadow.soft,
        style,
      ]}>
      {children}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withTiming(0.985, {duration: 90});
      }}
      onPressOut={() => {
        scale.value = withTiming(1, {duration: 150});
      }}
      onPress={() => {
        haptics.selection();
        onPress();
      }}>
      <Animated.View style={animatedStyle}>{content}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  padded: {padding: theme.spacing.lg},
});
