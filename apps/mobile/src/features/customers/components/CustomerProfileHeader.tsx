import React from 'react';
import { View } from 'react-native';
import { Avatar, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface CustomerProfileHeaderProps {
  name: string;
  phone: string;
  note?: string | null;
}

export function CustomerProfileHeader({ name, phone, note }: CustomerProfileHeaderProps) {
  const styles = useStyles();

  return (
    <View style={styles.root}>
      <Avatar name={name} size={56} />
      <View style={styles.info}>
        {note ? <Text variant="body" color="muted">{note}</Text> : null}
        <Text variant="body" weight={600} style={styles.phoneText}>{phone}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  root: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4 },
  info: { flex: 1, gap: 2 },
  phoneText: { writingDirection: 'ltr', textAlign: 'left' },
}));
