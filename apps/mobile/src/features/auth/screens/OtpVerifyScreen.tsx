import React, { useRef, useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { makeStyles } from '../../../theme';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { errorMessageKey } from '../../../core/api/app-error';
import { Button, OtpInput, Screen, StepHeader, Text } from '../../../shared/components';
import { useCountdown } from '../../../shared/hooks/use-countdown';
import { useRequestOtp, useVerifyOtp } from '../api/use-auth-mutations';

const RESEND_SECONDS = 60;

export function OtpVerifyScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { channel, contact, signup } = useRoute<RouteProp<AuthStackParamList, 'OtpVerify'>>().params;
  const [code, setCode] = useState('');
  // The input is cleared after a failed attempt, but sign-up still needs the code that was tried.
  const lastCode = useRef('');
  const verify = useVerifyOtp();
  const resend = useRequestOtp();
  const countdown = useCountdown(RESEND_SECONDS);

  const submit = (value: string) => {
    lastCode.current = value;
    verify.mutate({ channel, contact, code: value, signup }, { onError: () => setCode('') });
  };
  const resendCode = () => resend.mutate({ channel, contact }, { onSettled: () => countdown.restart() });

  const notRegistered = verify.error?.code === 'SIGNUP_REQUIRED';
  return (
    <View testID="otp-screen" style={styles.root}>
      <Screen>
        <StepHeader title={t('auth:otpTitle')} onBack={navigation.goBack} />
        {/* The isolate keeps "+20..." from being reordered inside the RTL sentence. */}
        <Text color="muted">{t('auth:otpSentTo', { contact: `⁦${contact}⁩`, interpolation: { escapeValue: false } })}</Text>
        <OtpInput value={code} onChange={setCode} onComplete={submit} error={!!verify.error} />
        {notRegistered ? (
          <>
            <Text color="danger">{t('auth:notRegistered')}</Text>
            <Button
              label={t('auth:createAccount')}
              onPress={() => navigation.navigate('Signup', { prefill: { channel, contact, code: lastCode.current } })}
            />
          </>
        ) : verify.error ? (
          <Text color="danger">{t(errorMessageKey(verify.error))}</Text>
        ) : null}
        {countdown.remaining > 0 ? (
          <Text variant="caption" color="muted">{t('auth:resendIn', { seconds: countdown.remaining })}</Text>
        ) : (
          <Button label={t('auth:resend')} variant="ghost" size="medium" loading={resend.isPending} onPress={resendCode} />
        )}
      </Screen>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  root: { flex: 1 },
}));
