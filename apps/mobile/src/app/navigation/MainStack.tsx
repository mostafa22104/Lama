import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AddManualCustomerScreen, CustomerProfileScreen } from '../../features/customers';
import { SubscriptionsScreen, SubscriptionDetailScreen } from '../../features/charges';
import { ComponentGalleryScreen } from '../../features/dev';
import { AddChargeScreen, AddCustomersScreen, NotebookReviewScreen, ReminderSettingsScreen } from '../../features/onboarding';
import { RemindersScreen } from '../../features/reminders';
import { SettingsScreen } from '../../features/settings';
import { MainTabs } from './MainTabs';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="CustomerProfile" component={CustomerProfileScreen} />
      <Stack.Screen name="Reminders" component={RemindersScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="AddCustomers" component={AddCustomersScreen} />
      <Stack.Screen name="AddManualCustomer" component={AddManualCustomerScreen} />
      <Stack.Screen name="NotebookReview" component={NotebookReviewScreen} />
      <Stack.Screen name="AddCharge" component={AddChargeScreen} />
      <Stack.Screen name="ReminderSettings" component={ReminderSettingsScreen} />
      <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
      <Stack.Screen name="SubscriptionDetail" component={SubscriptionDetailScreen} />
      {__DEV__ ? <Stack.Screen name="ComponentGallery" component={ComponentGalleryScreen} /> : null}
    </Stack.Navigator>
  );
}

