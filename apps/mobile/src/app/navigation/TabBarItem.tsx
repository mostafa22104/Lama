import React from 'react';
import { Pressable, View } from 'react-native';
import { Badge, Icon, type IconName, Text } from '../../shared/components';
import { makeStyles } from '../../theme';

interface TabBarItemProps {
  label: string;
  icon: IconName;
  focused: boolean;
  badge?: number;
  onPress: () => void;
}

export function TabBarItem({ label, icon, focused, badge = 0, onPress }: TabBarItemProps) {
  const styles = useStyles();
  return (
    <Pressable accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: focused }} onPress={onPress} style={styles.item}>
      <View style={[styles.pill, focused ? styles.pillActive : null]}>
        <Icon name={icon} color={focused ? 'primaryInk' : 'muted'} />
        {badge > 0 ? (
          <View style={styles.badge}>
            <Badge count={badge} />
          </View>
        ) : null}
      </View>
      <Text variant="caption" weight={focused ? 700 : 500} color={focused ? 'primaryInk' : 'muted'}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  pill: { width: 64, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: t.colors.primarySoft },
  badge: { position: 'absolute', top: -6, end: 6 },
}));
