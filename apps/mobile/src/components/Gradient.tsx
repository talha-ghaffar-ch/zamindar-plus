import React, {useId} from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';

type Props = {
  colors: readonly string[];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  start?: {x: number; y: number};
  end?: {x: number; y: number};
  borderRadius?: number;
};

/** A view filled with a linear gradient (SVG-backed, no native module needed). */
export function Gradient({
  colors,
  style,
  children,
  start = {x: 0, y: 0},
  end = {x: 1, y: 1},
  borderRadius = 0,
}: Props) {
  const raw = useId();
  const id = `g${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View style={[styles.wrap, style]}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinearGradient id={id} x1={start.x} y1={start.y} x2={end.x} y2={end.y}>
            {colors.map((c, i) => (
              <Stop
                key={i}
                offset={i / Math.max(1, colors.length - 1)}
                stopColor={c}
              />
            ))}
          </SvgLinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" rx={borderRadius} fill={`url(#${id})`} />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {overflow: 'hidden'},
});
