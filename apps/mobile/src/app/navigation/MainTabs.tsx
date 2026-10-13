import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ConfirmationsPlaceholderScreen } from '../../features/confirmations';
import { CustomersPlaceholderScreen } from '../../features/customers';
import { HomePlaceholderScreen } from '../../features/home';
import { ReportsPlaceholderScreen } from '../../features/reports';
import { TabBar } from './TabBar';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Home" component={HomePlaceholderScreen} />
      <Tab.Screen name="Customers" component={CustomersPlaceholderScreen} />
      <Tab.Screen name="Confirmations" component={ConfirmationsPlaceholderScreen} />
      <Tab.Screen name="Reports" component={ReportsPlaceholderScreen} />
    </Tab.Navigator>
  );
}
