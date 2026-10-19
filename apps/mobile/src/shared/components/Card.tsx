import React, { type ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import { makeStyles } from '../../theme';

export function Card({
  children,
  style,
  testID,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const styles = useStyles();
  return <View testID={testID} style={[styles.card, style]}>{children}</View>;
}

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderColor: t.colors.line,
    borderWidth: 1,
    borderRadius: t.radius.card,
    padding: t.spacing.cardPadding,
    gap: 12,
  },
}));
