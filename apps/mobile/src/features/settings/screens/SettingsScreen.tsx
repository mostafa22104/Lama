import React, { useState } from 'react';
import { Alert, Pressable, RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { BusinessUpdate } from '@lamma/shared';
import { Button, Card, Icon, Screen, Skeleton, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';
import { signOut } from '../../auth';
import { useBusiness, useBusinessUsage, useRequestUpgrade, useUpdateBusiness } from '../api/use-business';
import { AppearanceCard } from '../components/AppearanceCard';
import { BackupToggleCard } from '../components/BackupToggleCard';
import { BusinessInfoCard } from '../components/BusinessInfoCard';
import { EditBusinessModal } from '../components/EditBusinessModal';
import { InstapayCard } from '../components/InstapayCard';
import { PlanCard } from '../components/PlanCard';
import { TeamCard } from '../components/TeamCard';

export function SettingsScreen() {
  const styles = useStyles();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [editBusinessOpen, setEditBusinessOpen] = useState(false);

  const { data: business, isLoading: loadingBusiness, refetch, isRefetching } = useBusiness();
  const { data: usage } = useBusinessUsage();
  const updateMutation = useUpdateBusiness();
  const upgradeMutation = useRequestUpgrade();

  if (loadingBusiness || !business) {
    return <Screen><Skeleton width="100%" height={50} radius={12} /><Skeleton width="100%" height={140} radius={18} /><Skeleton width="100%" height={180} radius={18} /></Screen>;
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

  const handleEditBusiness = (patch: BusinessUpdate) => {
    updateMutation.mutate(patch, {
      onSuccess: () => {
        setEditBusinessOpen(false);
        Alert.alert('✅', 'تم تعديل بيانات النشاط بنجاح');
      },
      onError: () => Alert.alert('❌', 'فشل تعديل البيانات'),
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

      <BusinessInfoCard business={business} onEdit={() => setEditBusinessOpen(true)} />

      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Subscriptions' as never)}>
        <Card style={styles.navRowCard}>
          <View style={styles.navRowLeft}>
            <View style={styles.iconBox}>
              <Icon name="calendar" size={20} color="primary" />
            </View>
            <View style={styles.navRowText}>
              <Text variant="body" weight={700}>{t('settings:subscriptionsTitle', { defaultValue: 'الاشتراكات والرسوم' })}</Text>
              <Text variant="caption" color="muted">{t('settings:subscriptionsSubtitle', { defaultValue: 'إدارة الاشتراكات والعملاء المسجلين' })}</Text>
            </View>
          </View>
          <Icon name="chevronForward" size={20} color="muted" />
        </Card>
      </Pressable>

      <InstapayCard instapayAddress={business.instapayAddress} />

      <PlanCard
        plan={business.plan}
        customerCount={usage?.customerCount ?? 0}
        maxCustomers={usage?.maxCustomers ?? 500}
        onRequestUpgrade={handleRequestUpgrade}
        isUpgrading={upgradeMutation.isPending}
      />

      <TeamCard ownerName={business.name} />

      <AppearanceCard />

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

      <EditBusinessModal
        visible={editBusinessOpen}
        business={business}
        isPending={updateMutation.isPending}
        onClose={() => setEditBusinessOpen(false)}
        onSubmit={handleEditBusiness}
      />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1 },
  logoutWrap: { marginVertical: 8 },
  navRowCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  navRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  navRowText: { flex: 1, gap: 2 },
}));


