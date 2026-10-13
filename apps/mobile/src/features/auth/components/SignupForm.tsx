import React from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { BUSINESS_TYPES, type BusinessType } from '@lamma/shared';
import { ChipSelect, Text, TextField } from '../../../shared/components';
import type { SignupValues } from '../schemas/signup-schema';
import { ContactFields } from './ContactFields';

export function SignupForm({ form, lockContact }: { form: UseFormReturn<SignupValues>; lockContact?: boolean }) {
  const { t } = useTranslation();
  const { control, formState, watch } = form;
  const error = (key: keyof SignupValues) => {
    const message = formState.errors[key]?.message;
    return message ? t(message) : undefined;
  };
  return (
    <>
      <ContactFields control={control as never} errors={formState.errors} channel={watch('channel')} locked={lockContact} />
      <Controller
        control={control}
        name="businessName"
        render={({ field }) => (
          <TextField label={t('auth:businessNameLabel')} value={field.value} onChangeText={field.onChange} error={error('businessName')} />
        )}
      />
      <Text weight={600}>{t('auth:businessTypeLabel')}</Text>
      <Controller
        control={control}
        name="businessType"
        render={({ field }) => (
          <ChipSelect<BusinessType>
            options={BUSINESS_TYPES.map((type) => ({ value: type, label: t(`common:businessType.${type}`) }))}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="instapayAddress"
        render={({ field }) => (
          <TextField
            label={t('auth:instapayLabel')}
            hint={t('auth:instapayHint')}
            value={field.value}
            onChangeText={field.onChange}
            error={error('instapayAddress')}
            autoCapitalize="none"
            ltr
          />
        )}
      />
    </>
  );
}
