import React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { MainStackParamList } from '../../../app/navigation/types';
import { Button, Icon, type IconName, Screen, StepHeader, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface MethodOption {
  key: string;
  icon: IconName;
  title: string;
  desc: string;
  badge?: string;
}

export function AddCustomersScreen() {
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { t } = useTranslation();

  const methods: MethodOption[] = [
    {
      key: 'notebook',
      icon: 'camera',
      title: t('onboarding:notebookTitle'),
      desc: t('onboarding:notebookDesc'),
      badge: t('onboarding:easiestBadge'),
    },
    {
      key: 'contacts',
      icon: 'contacts',
      title: t('onboarding:contactsTitle'),
      desc: t('onboarding:contactsDesc'),
    },
    {
      key: 'excel',
      icon: 'excel',
      title: t('onboarding:excelTitle'),
      desc: t('onboarding:excelDesc'),
    },
  ];

  return (
    <Screen
      scroll
      footer={
        <Button
          label={t('onboarding:skipLater')}
          variant="ghost"
          onPress={() => navigation.navigate('AddCharge')}
        />
      }
    >
      <StepHeader
        title={t('onboarding:addCustomersTitle')}
        step={2}
        total={4}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined}
      />

      <Text variant="body" color="muted" style={styles.subtitle}>
        {t('onboarding:addCustomersSubtitle')}
      </Text>

      <View style={styles.list}>
        {methods.map((m) => (
          <Pressable
            key={m.key}
            accessibilityRole="button"
            onPress={() => navigation.navigate('NotebookReview')}
            style={[styles.card, m.badge ? styles.primaryCard : undefined]}
          >
            {m.badge ? (
              <View style={styles.badge}>
                <Text variant="caption" weight={700} style={styles.badgeText}>
                  {m.badge}
                </Text>
              </View>
            ) : null}

            <View style={styles.iconCircle}>
              <Icon name={m.icon} size={28} color="primary" />
            </View>

            <View style={styles.cardText}>
              <Text variant="body" weight={700}>{m.title}</Text>
              <Text variant="caption" color="muted" style={styles.desc}>{m.desc}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  subtitle: { marginBottom: 12 },
  list: { gap: 14 },
  card: {
    backgroundColor: t.colors.surface,
    borderColor: t.colors.line,
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 104,
    position: 'relative',
  },
  primaryCard: {
    borderColor: t.colors.primary,
    borderWidth: 2,
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 14,
    backgroundColor: t.colors.gold,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeText: {
    color: t.colors.onPrimary,
    fontSize: 11,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: t.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  desc: {
    lineHeight: 18,
  },
}));
