import React from 'react';
import { View } from 'react-native';
import { makeStyles } from '../../theme';
import { Text } from './Text';

export function Badge({ count }: { count: number }) {
  const styles = useStyles();
  if (count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text variant="caption" weight={700} color="onPrimary">{count > 9 ? '9+' : String(count)}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 5, backgroundColor: t.colors.danger, alignItems: 'center', justifyContent: 'center' },
}));
