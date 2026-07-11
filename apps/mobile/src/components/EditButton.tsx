import React from 'react';
import {Pressable} from 'react-native';
import {Pencil} from 'lucide-react-native';
import {theme} from '../theme';
import {haptics} from '../haptics';

export function EditButton({onPress, size = 20}: {onPress: () => void; size?: number}) {
  return (
    <Pressable
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      hitSlop={10}>
      <Pencil color={theme.colors.textSecondary} size={size} />
    </Pressable>
  );
}
