import React from 'react';
import { Alert, Pressable, RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Button, Icon, Screen, Skeleton, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';
import { signOut } from '../../auth';
import { useBusiness, useBusinessUsage, useRequestUpgrade, useUpdateBusiness } from '../api/use-business';
import { BackupToggleCard } from '../components/BackupToggleCard';
import { BusinessInfoCard } from '../components/BusinessInfoCard';
import { InstapayCard } from '../components/InstapayCard';
import { PlanCard } from '../components/PlanCard';
import { TeamCard } from '../components/TeamCard';

export function SettingsScreen() {
  const styles = useStyles();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const { data: business, isLoading: loadingBusiness, refetch, isRefetching } = useBusiness();
  const { data: usage } = useBusinessUsage();
  const updateMutation = useUpdateBusiness();
  const upgradeMutation = useRequestUpgrade();

  if (loadingBusiness || !business) {
    return (
      <Screen>
        <Skeleton width="100%" height={50} radius={12} />
        <Skeleton width="100%" height={140} radius={18} />
        <Skeleton width="100%" height={180} radius={18} />
      </Screen>
    );
  }

  const handleLogout = () => {
    Alert.alert(t('settings:logout'), t('settings:logoutConfirm'), [
      { text: t('common:back'), style: 'cancel' },
      {
        text: t('settings:logout'),
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  const handleRequestUpgrade = () => {
    upgradeMutation.mutate(undefined, {
      onSuccess: () => Alert.alert('✅', t('settings:upgradeRequested')),
    });
  };

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            void refetch();
          }}
        />
      }
    >
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrowBack" size={22} color="ink" />
        </Pressable>
        <Text variant="screenTitle" weight={700} style={styles.title}>{t('settings:title')}</Text>
      </View>

      <BusinessInfoCard business={business} />
      <InstapayCard instapayAddress={business.instapayAddress} />

      <PlanCard
        plan={business.plan}
        customerCount={usage?.customerCount ?? 0}
        maxCustomers={usage?.maxCustomers ?? 500}
        onRequestUpgrade={handleRequestUpgrade}
        isUpgrading={upgradeMutation.isPending}
      />

      <TeamCard ownerName={business.name} />

      <BackupToggleCard
        value={business.weeklyBackup}
        onValueChange={(val) => updateMutation.mutate({ weeklyBackup: val })}
      />

      <View style={styles.logoutWrap}>
        <Button
          label={t('settings:logout')}
          variant="danger"
          onPress={handleLogout}
        />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1 },
  logoutWrap: { marginVertical: 8 },
}));
