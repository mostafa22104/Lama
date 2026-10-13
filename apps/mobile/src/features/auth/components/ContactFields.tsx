import React from 'react';
import { type Control, Controller, type FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { ContactChannel } from '@lamma/shared';
import { PhoneInput, SegmentedControl, TextField } from '../../../shared/components';

interface ContactValues {
  channel: ContactChannel;
  contact: string;
}

interface ContactFieldsProps {
  control: Control<ContactValues & Record<string, unknown>>;
  errors: FieldErrors<ContactValues>;
  channel: ContactChannel;
  /** Read-only contact (carried over from login). */
  locked?: boolean;
}

export function ContactFields({ control, errors, channel, locked }: ContactFieldsProps) {
  const { t } = useTranslation();
  const error = errors.contact?.message ? t(errors.contact.message) : undefined;
  return (
    <>
      <Controller
        control={control}
        name="channel"
        render={({ field }) => (
          <SegmentedControl
            options={[{ value: 'phone', label: t('auth:channelPhone') }, { value: 'email', label: t('auth:channelEmail') }]}
            value={field.value as ContactChannel}
            onChange={field.onChange}
            disabled={locked}
          />
        )}
      />
      <Controller
        control={control}
        name="contact"
        render={({ field }) =>
          channel === 'phone' ? (
            <PhoneInput label={t('auth:phoneLabel')} value={field.value as string} onChangeText={field.onChange} error={error} editable={!locked} />
          ) : (
            <TextField
              label={t('auth:emailLabel')}
              value={field.value as string}
              onChangeText={field.onChange}
              error={error}
              editable={!locked}
              keyboardType="email-address"
              autoCapitalize="none"
              ltr
            />
          )
        }
      />
    </>
  );
}
