import React from 'react';
import { useAuthStore } from '../../features/auth';
import { OfflineScreen } from '../screens/OfflineScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';

export function RootNavigator() {
  const status = useAuthStore((state) => state.status);
  if (status === 'restoring') return <SplashScreen />;
  if (status === 'offline') return <OfflineScreen />;
  return status === 'signedIn' ? <MainStack /> : <AuthStack />;
}
