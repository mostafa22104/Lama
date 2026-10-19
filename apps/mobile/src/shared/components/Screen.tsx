import React, { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles } from '../../theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  refreshControl?: React.ReactElement;
  /** Pinned to the bottom (e.g. the primary button), above the keyboard. */
  footer?: ReactNode;
}

export function Screen({ children, scroll = true, refreshControl, footer }: ScreenProps) {
  const styles = useStyles();
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.fill]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  fill: { flex: 1 },
  content: { paddingHorizontal: t.spacing.screenPaddingX, paddingVertical: 16, gap: t.spacing.stackGap },
  footer: { paddingHorizontal: t.spacing.screenPaddingX, paddingBottom: 16, paddingTop: 8 },
}));
