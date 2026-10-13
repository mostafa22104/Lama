import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '../../theme';
import { Icon } from './Icon';
import { Text } from './Text';

interface StepHeaderProps {
  title: string;
  step?: number;
  total?: number;
  onBack?: () => void;
}

export function StepHeader({ title, step, total, onBack }: StepHeaderProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text variant="screenTitle" accessibilityRole="header" style={styles.title}>{title}</Text>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="back" onPress={onBack} style={styles.back}>
            <Icon name="arrowBack" />
          </Pressable>
        ) : null}
      </View>
      {step && total ? (
        <>
          <View style={styles.bars}>
            {Array.from({ length: total }, (_, i) => (
              <View key={i} style={[styles.bar, i < step ? styles.barDone : null]} />
            ))}
          </View>
          <Text variant="caption" color="muted">{t('auth:stepOf', { step, total })}</Text>
        </>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  title: { flex: 1 },
  back: {
    width: 48, height: 48, borderRadius: t.radius.iconTile, borderWidth: 1, borderColor: t.colors.line,
    backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  bars: { flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: t.colors.disabledBg },
  barDone: { backgroundColor: t.colors.primary },
}));
