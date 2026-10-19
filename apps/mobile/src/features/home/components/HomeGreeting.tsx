import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface HomeGreetingProps {
  businessName: string;
  onOpenSettings: () => void;
}

export function HomeGreeting({ businessName, onOpenSettings }: HomeGreetingProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const initial = businessName.trim().charAt(0) || 'ل';

  return (
    <View style={styles.root}>
      <View style={styles.avatarTile}>
        <Text variant="screenTitle" weight={700} style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.titles}>
        <Text variant="caption" color="muted" numberOfLines={1}>{businessName}</Text>
        <Text variant="screenTitle" weight={700} numberOfLines={1}>{t('home:greeting')}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('home:settingsA11y')}
        onPress={onOpenSettings}
        style={styles.settingsBtn}
      >
        <Icon name="settings" color="ink" size={22} />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  avatarTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: t.colors.goldSoft,
    borderWidth: 1.5,
    borderColor: t.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: t.colors.gold },
  titles: { flex: 1, justifyContent: 'center' },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
