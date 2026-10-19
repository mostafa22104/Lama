import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface UndoSnackbarProps {
  message: string;
  onUndo: () => void;
}

export function UndoSnackbar({ message, onUndo }: UndoSnackbarProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <View testID="undo-snackbar" style={styles.container}>
      <Text variant="body" weight={600} style={styles.text}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onUndo} style={styles.btn}>
        <Text variant="body" weight={700} style={styles.btnText}>
          {t('confirmations:undoBtn')}
        </Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    backgroundColor: t.colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  text: {
    color: t.colors.onPrimary,
    flex: 1,
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  btnText: {
    color: t.colors.primarySoft,
  },
}));
