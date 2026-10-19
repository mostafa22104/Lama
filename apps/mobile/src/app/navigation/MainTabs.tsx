import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ConfirmationsScreen } from '../../features/confirmations';
import { CustomersScreen } from '../../features/customers';
import { HomeScreen } from '../../features/home';
import { ReportsScreen } from '../../features/reports';
import { TabBar } from './TabBar';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Customers" component={CustomersScreen} />
      <Tab.Screen name="Confirmations" component={ConfirmationsScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}
