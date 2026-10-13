import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { normalizeContact } from '@lamma/shared';
import { makeStyles } from '../../../theme';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { errorMessageKey, type AppError } from '../../../core/api/app-error';
import { Button, Screen, StepHeader, Text } from '../../../shared/components';
import { useRequestOtp } from '../api/use-auth-mutations';
import { ContactFields } from '../components/ContactFields';
import { loginSchema, type LoginValues } from '../schemas/login-schema';

export function LoginScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const requestOtp = useRequestOtp();
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { channel: 'phone', contact: '' } });

  const submit = async ({ channel, contact: rawContact }: LoginValues) => {
    // The schema already proved the contact normalizes; fall back to raw only to satisfy the type.
    const contact = normalizeContact(channel, rawContact) ?? rawContact;
    try {
      await requestOtp.mutateAsync({ channel, contact });
    } catch (error) {
      if ((error as AppError).code !== 'OTP_COOLDOWN') return;
    }
    navigation.navigate('OtpVerify', { channel, contact });
  };

  const footer = (
    <View style={styles.footer}>
      {requestOtp.error ? <Text color="danger" align="center">{t(errorMessageKey(requestOtp.error))}</Text> : null}
      <Button label={t('auth:sendCode')} loading={requestOtp.isPending} onPress={form.handleSubmit(submit)} />
      <Button label={t('auth:noAccount')} variant="ghost" size="medium" onPress={() => navigation.navigate('Signup', undefined)} />
    </View>
  );
  return (
    <View testID="login-screen" style={styles.root}>
      <Screen footer={footer}>
        <StepHeader title={t('auth:loginTitle')} onBack={navigation.canGoBack() ? navigation.goBack : undefined} />
        <ContactFields control={form.control} errors={form.formState.errors} channel={form.watch('channel')} />
      </Screen>
    </View>
  );
}

const useStyles = makeStyles((th) => ({
  root: { flex: 1 },
  footer: { gap: th.spacing.stackGap },
}));
