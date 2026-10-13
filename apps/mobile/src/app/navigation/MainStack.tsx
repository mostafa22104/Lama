import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ComponentGalleryScreen } from '../../features/dev';
import { MainTabs } from './MainTabs';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      {__DEV__ ? <Stack.Screen name="ComponentGallery" component={ComponentGalleryScreen} /> : null}
    </Stack.Navigator>
  );
}
