import React from 'react';
import { SafeAreaView, Text } from 'react-native';
import { formatAmount, resources, toBusinessDate } from '@lamma/shared';

export default function App() {
  return (
    <SafeAreaView>
      <Text>{resources.ar.common.appName}</Text>
      <Text>{formatAmount(23400)}</Text>
      <Text>{toBusinessDate(new Date('2026-09-20T22:30:00Z'))}</Text>
    </SafeAreaView>
  );
}
