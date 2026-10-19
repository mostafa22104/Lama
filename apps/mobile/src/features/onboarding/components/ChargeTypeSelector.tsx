import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface ChargeTypeSelectorProps {
  value: 'monthly' | 'one_time';
  onChange: (value: 'monthly' | 'one_time') => void;
}

export function ChargeTypeSelector({ value, onChange }: ChargeTypeSelectorProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <View style={styles.grid2}>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange('monthly')}
        style={[styles.typeBtn, value === 'monthly' ? styles.typeBtnActive : undefined]}
      >
        <Icon name="calendar" size={22} color={value === 'monthly' ? 'primary' : 'ink'} />
        <Text variant="body" weight={700} color={value === 'monthly' ? 'primary' : 'ink'}>
          {t('onboarding:monthlyType')}
        </Text>
        <Text variant="caption" color="muted">{t('onboarding:monthlyDesc')}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange('one_time')}
        style={[styles.typeBtn, value === 'one_time' ? styles.typeBtnActive : undefined]}
      >
        <Icon name="cash" size={22} color={value === 'one_time' ? 'primary' : 'ink'} />
        <Text variant="body" weight={700} color={value === 'one_time' ? 'primary' : 'ink'}>
          {t('onboarding:oneTimeType')}
        </Text>
        <Text variant="caption" color="muted">{t('onboarding:oneTimeDesc')}</Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  grid2: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: t.colors.line,
    backgroundColor: t.colors.surface,
    gap: 4,
  },
  typeBtnActive: {
    borderColor: t.colors.primary,
    borderWidth: 2,
    backgroundColor: t.colors.primarySoft,
  },
}));
