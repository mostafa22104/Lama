import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppError } from '../../../core/api/app-error';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { useRequestOtp, useVerifyOtp } from '../api/use-auth-mutations';
import type { SignupValues } from '../schemas/signup-schema';

type Prefill = NonNullable<AuthStackParamList['Signup']>['prefill'];

export function useSignupSubmit(prefill: Prefill) {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  const submit = async ({ channel, contact, businessName, businessType, instapayAddress }: SignupValues) => {
    const signup = { businessName, businessType, instapayAddress };
    if (prefill) {
      // Coming from login with SIGNUP_REQUIRED: the typed code is still valid, so verify directly.
      await verifyOtp.mutateAsync({ channel, contact, code: prefill.code, signup }).catch(() => undefined);
      return;
    }
    try {
      await requestOtp.mutateAsync({ channel, contact });
    } catch (error) {
      if ((error as AppError).code !== 'OTP_COOLDOWN') return;
    }
    navigation.navigate('OtpVerify', { channel, contact, signup });
  };

  const error = (prefill ? verifyOtp.error : requestOtp.error) ?? null;
  return { submit, pending: requestOtp.isPending || verifyOtp.isPending, error };
}
