import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface MonthSelectorProps {
  period: string;
  onPrev: () => void;
  onNext: () => void;
  canNext?: boolean;
}

export function MonthSelector({ period, onPrev, onNext, canNext = true }: MonthSelectorProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  const [yearStr, monthStr] = period.split('-');
  const monthIdx = Number(monthStr ?? '10') - 1;
  const monthName = t(`common:months.${monthIdx}`);
  const displayLabel = `${monthName} ${yearStr}`;

  return (
    <View style={styles.root}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('reports:prevMonthA11y')} onPress={onPrev} style={styles.arrowBtn}>
        <Icon name="arrowBack" size={20} color="ink" />
      </Pressable>
      <Text variant="section" weight={700} style={styles.label}>{displayLabel}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('reports:nextMonthA11y')}
        onPress={onNext}
        disabled={!canNext}
        style={[styles.arrowBtn, !canNext ? styles.disabledBtn : null]}
      >
        <Icon name="chevronForward" size={20} color={canNext ? 'ink' : 'muted'} />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.line,
    borderRadius: 14,
    padding: 4,
  },
  arrowBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  disabledBtn: { opacity: 0.4 },
  label: { textAlign: 'center' },
}));
