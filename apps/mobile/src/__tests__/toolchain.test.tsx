import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import Check from 'lucide-react-native/icons/check';
import { createMMKV } from 'react-native-mmkv';
import { formatAmount, resources, toBusinessDate } from '@lamma/shared';

test('shared package, MMKV mock, icons and Intl work under Jest', async () => {
  const kv = createMMKV({ id: 'probe' });
  kv.set('k', 'v');
  await render(
    <>
      <Text>{`${formatAmount(23400)} ${toBusinessDate(new Date('2026-09-20T22:30:00Z'))} ${kv.getString('k')}`}</Text>
      <Text>{resources.ar.common.appName}</Text>
      <Check />
    </>,
  );
  expect(screen.getByText('23,400 2026-09-21 v')).toBeTruthy();
  expect(screen.getByText('لَمّة')).toBeTruthy();
});
