import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { makeStyles } from '../../../theme';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { errorMessageKey } from '../../../core/api/app-error';
import { Button, Screen, StepHeader, Text } from '../../../shared/components';
import { SignupForm } from '../components/SignupForm';
import { useSignupSubmit } from '../hooks/use-signup-submit';
import { signupSchema, type SignupValues } from '../schemas/signup-schema';

export function SignupScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation();
  const prefill = useRoute<RouteProp<AuthStackParamList, 'Signup'>>().params?.prefill;
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      channel: prefill?.channel ?? 'phone',
      contact: prefill?.contact ?? '',
      businessName: '',
      businessType: 'academy',
      instapayAddress: '',
    },
  });
  const { submit, pending, error } = useSignupSubmit(prefill);
  const footer = (
    <View style={styles.footer}>
      {error ? <Text color="danger" align="center">{t(errorMessageKey(error))}</Text> : null}
      <Button label={t('auth:continue')} loading={pending} onPress={form.handleSubmit(submit)} />
      {!prefill ? (
        <Button label={t('auth:haveAccount')} variant="ghost" size="medium" onPress={() => navigation.navigate('Login' as never)} />
      ) : null}
    </View>
  );
  return (
    <View testID="signup-screen" style={styles.root}>
      <Screen footer={footer}>
        <StepHeader title={t('auth:signupTitle')} step={1} total={4} onBack={navigation.canGoBack() ? navigation.goBack : undefined} />
        <SignupForm form={form} lockContact={!!prefill} />
      </Screen>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1 },
  footer: { gap: t.spacing.stackGap },
}));
