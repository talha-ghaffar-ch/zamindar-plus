import React, {useState} from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import {theme} from '../theme';
import {AppText} from './AppText';

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  /** Tighter height/padding — used on long forms (signup) to fit without scroll. */
  dense?: boolean;
};

export function Input({
  label,
  error,
  leftIcon,
  rightSlot,
  containerStyle,
  style,
  dense,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.danger
    : focused
    ? theme.colors.primaryBright
    : theme.colors.border;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <AppText
          variant="small"
          color={theme.colors.textSecondary}
          style={[styles.label, dense && styles.labelDense]}>
          {label}
        </AppText>
      ) : null}
      <View style={[styles.field, dense && styles.fieldDense, {borderColor}]}>
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.primaryBright}
          onFocus={e => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.input, dense && styles.inputDense, style]}
          {...rest}
        />
        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
      </View>
      {error ? (
        <AppText variant="small" color={theme.colors.danger} style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {width: '100%'},
  label: {marginBottom: 6, marginLeft: 2},
  labelDense: {marginBottom: 3},
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    minHeight: 52,
  },
  fieldDense: {minHeight: 46},
  leftIcon: {marginRight: theme.spacing.sm},
  rightSlot: {marginLeft: theme.spacing.sm},
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    paddingVertical: 14,
  },
  inputDense: {paddingVertical: 9},
  error: {marginTop: 5, marginLeft: 2},
});
