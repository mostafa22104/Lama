import React from 'react';
import { changeLanguage, useLanguageStore } from '../../../i18n';
import { Button, Card, SegmentedControl, Text } from '../../../shared/components';
import { type ThemeMode, useThemeStore } from '../../../theme';
import { signOut } from '../../auth';

export function GallerySettings() {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const language = useLanguageStore((state) => state.language);
  return (
    <Card>
      <Text variant="section">Theme</Text>
      <SegmentedControl<ThemeMode>
        options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System' }]}
        value={mode}
        onChange={setMode}
      />
      <Text variant="section">Language (restarts the app)</Text>
      <SegmentedControl
        options={[{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }]}
        value={language}
        onChange={(next) => changeLanguage(next)}
      />
      <Button label="Log out" variant="danger" icon="logout" onPress={() => void signOut()} />
    </Card>
  );
}
