import React from 'react';
import {Alert, Pressable} from 'react-native';
import {Trash2} from 'lucide-react-native';
import {useI18n} from '../i18n/useT';
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
  const {t} = useI18n();

  const press = () => {
    Alert.alert(title, message, [
      {text: t('common.cancel'), style: 'cancel'},
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            haptics.warning();
            await onConfirm();
          } catch (e) {
            Alert.alert(t('mobile.couldNotDelete'), (e as Error).message);
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
