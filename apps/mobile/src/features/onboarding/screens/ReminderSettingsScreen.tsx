import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MainStackParamList } from '../../../app/navigation/types';
import { api } from '../../../core/api/instances';
import { Button, Card, Icon, Screen, StepHeader, Text, Toggle } from '../../../shared/components';
import { makeStyles } from '../../../theme';

export function ReminderSettingsScreen() {
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [before3Days, setBefore3Days] = useState(true);
  const [onDueDate, setOnDueDate] = useState(true);
  const [after3Days, setAfter3Days] = useState(true);

  const saveRuleMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put('/reminders/rule', {
        beforeDays: before3Days ? 3 : null,
        onDueDate,
        afterDays: after3Days ? 3 : null,
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reminders'] });
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
    },
  });

  return (
    <Screen
      scroll
      footer={
        <Button
          label={t('onboarding:finishBtn')}
          loading={saveRuleMutation.isPending}
          onPress={() => saveRuleMutation.mutate()}
        />
      }
    >
      <StepHeader
        title={t('onboarding:remindersTitle')}
        step={4}
        total={4}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined}
      />

      <Text variant="body" color="muted" style={styles.subtitle}>
        {t('onboarding:remindersSubtitle')}
      </Text>

      <Card style={styles.rulesCard}>
        <View style={styles.ruleRow}>
          <View style={styles.ruleText}>
            <Text variant="body" weight={700}>{t('onboarding:before3Days')}</Text>
            <Text variant="caption" color="muted">{t('onboarding:before3DaysDesc')}</Text>
          </View>
          <Toggle value={before3Days} onChange={setBefore3Days} label={t('onboarding:before3Days')} />
        </View>

        <View style={styles.ruleRow}>
          <View style={styles.ruleText}>
            <Text variant="body" weight={700}>{t('onboarding:onDueDate')}</Text>
            <Text variant="caption" color="muted">{t('onboarding:onDueDateDesc')}</Text>
          </View>
          <Toggle value={onDueDate} onChange={setOnDueDate} label={t('onboarding:onDueDate')} />
        </View>

        <View style={styles.lastRow}>
          <View style={styles.ruleText}>
            <Text variant="body" weight={700}>{t('onboarding:after3Days')}</Text>
            <Text variant="caption" color="muted">{t('onboarding:after3DaysDesc')}</Text>
          </View>
          <Toggle value={after3Days} onChange={setAfter3Days} label={t('onboarding:after3Days')} />
        </View>
      </Card>

      <View style={styles.previewSection}>
        <View style={styles.previewHeader}>
          <Text variant="body" weight={600}>{t('onboarding:previewTitle')}</Text>
          <Text variant="caption" color="muted">{t('onboarding:before3Days')}</Text>
        </View>

        <View style={styles.chatBox}>
          <View style={styles.chatBubble}>
            <Text variant="body" style={styles.bubbleText}>
              {t('onboarding:previewSampleMessage')}
            </Text>
            <View style={styles.bubbleFooter}>
              <Icon name="whatsapp" size={14} color="whatsapp" />
              <Text variant="caption" color="muted">10:00 ص</Text>
            </View>
          </View>
        </View>
        <Text variant="caption" color="muted">{t('onboarding:previewHint')}</Text>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  subtitle: { marginBottom: 12 },
  rulesCard: { padding: 0, overflow: 'hidden' },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.line,
  },
  lastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  ruleText: { flex: 1, gap: 2 },
  previewSection: { marginTop: 16, gap: 8 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatBox: {
    backgroundColor: t.colors.chatBg,
    borderRadius: 18,
    padding: 14,
    minHeight: 140,
    alignItems: 'flex-start',
  },
  chatBubble: {
    backgroundColor: t.colors.surface,
    borderRadius: 12,
    padding: 10,
    maxWidth: '90%',
    gap: 6,
    elevation: 1,
  },
  bubbleText: { fontSize: 14, lineHeight: 22 },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
}));
