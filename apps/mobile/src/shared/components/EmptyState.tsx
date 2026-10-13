import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import { makeStyles } from '../../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      <View style={styles.tile}>
        <Icon name={icon} size={32} color="primaryInk" />
      </View>
      <Text variant="section" align="center">{title}</Text>
      {message ? <Text color="muted" align="center">{message}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  tile: { width: 72, height: 72, borderRadius: t.radius.cardLarge, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  action: { alignSelf: 'stretch', marginTop: 8 },
}));
