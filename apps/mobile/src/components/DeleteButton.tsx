import React from 'react';
import {Alert, Pressable} from 'react-native';
import {Trash2} from 'lucide-react-native';
import {theme} from '../theme';
import {haptics} from '../haptics';

type Props = {
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
  size?: number;
};

/** A trash icon that confirms via a native dialog, then runs an async delete. */
export function DeleteButton({title, message, onConfirm, size = 20}: Props) {
  const press = () => {
    Alert.alert(title, message, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            haptics.warning();
            await onConfirm();
          } catch (e) {
            Alert.alert('Could not delete', (e as Error).message);
          }
        },
      },
    ]);
  };

  return (
    <Pressable onPress={press} hitSlop={10}>
      <Trash2 color={theme.colors.danger} size={size} />
    </Pressable>
  );
}
