import React from 'react';
import { View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { IconName } from '../../shared/components';
import { makeStyles } from '../../theme';
import { TabBarItem } from './TabBarItem';
import type { MainTabParamList } from './types';

const TABS: Record<keyof MainTabParamList, { icon: IconName; label: string }> = {
  Home: { icon: 'home', label: 'common:tabs.home' },
  Customers: { icon: 'users', label: 'common:tabs.customers' },
  Confirmations: { icon: 'confirmations', label: 'common:tabs.confirmations' },
  Reports: { icon: 'reports', label: 'common:tabs.reports' },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name as keyof MainTabParamList];
        return (
          <TabBarItem
            key={route.key}
            label={t(tab.label)}
            icon={tab.icon}
            focused={state.index === index}
            onPress={() => navigation.navigate(route.name)}
          />
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  bar: { flexDirection: 'row', height: t.sizes.bottomNav, backgroundColor: t.colors.surface, borderTopWidth: 1, borderTopColor: t.colors.line, boxSizing: 'content-box' },
}));
