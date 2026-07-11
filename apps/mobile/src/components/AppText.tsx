import React from 'react';
import {StyleProp, StyleSheet, Text, TextProps, TextStyle} from 'react-native';
import {theme, typography} from '../theme';

type Variant = keyof typeof typography;

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  center?: boolean;
  style?: StyleProp<TextStyle>;
};

export function AppText({
  variant = 'body',
  color = theme.colors.text,
  center,
  style,
  children,
  ...rest
}: Props) {
  return (
    <Text
      allowFontScaling
      {...rest}
      style={[
        typography[variant] as TextStyle,
        {color},
        center && styles.center,
        style,
      ]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  center: {textAlign: 'center'},
});
