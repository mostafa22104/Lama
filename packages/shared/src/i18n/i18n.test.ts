import { describe, expect, it } from 'vitest';
import { INVOICE_STATUSES } from '../domain/invoiceStatus.js';
import { BUSINESS_TYPES } from '../types/business.js';
import { ERROR_CODES } from '../types/errors.js';
import { LOCALES } from '../types/locale.js';
import { DEFAULT_LOCALE, isRtl, resources } from './index.js';

describe('i18n resources', () => {
  it.each(LOCALES)('%s has a non-empty message for every error code', (locale) => {
    for (const code of ERROR_CODES) {
      expect(resources[locale].errors[code], `${locale}.errors.${code}`).toMatch(/\S/);
    }
  });

  it.each(LOCALES)('%s labels every invoice status and business type', (locale) => {
    for (const status of INVOICE_STATUSES) {
      expect(resources[locale].common.status[status]).toMatch(/\S/);
    }
    for (const type of BUSINESS_TYPES) {
      expect(resources[locale].common.businessType[type]).toMatch(/\S/);
    }
  });

  it('ships the auth screens copy from the Signup design', () => {
    expect(resources.ar.auth).toMatchObject({
      signupTitle: 'حساب جديد',
      channelPhone: 'موبايل',
      channelEmail: 'إيميل',
      phoneLabel: 'رقم الموبايل',
      businessNameLabel: 'اسم النشاط',
      businessTypeLabel: 'نوع النشاط',
      instapayLabel: 'عنوان InstaPay',
      instapayHint: 'ده العنوان اللي عملاءك هيحوّلوا عليه',
      continue: 'كمّل',
    });
    expect(resources.ar.common.tabs).toEqual({
      home: 'الرئيسية',
      customers: 'العملاء',
      confirmations: 'التأكيدات',
      reports: 'التقارير',
    });
  });

  it('uses the design copy for the four payment chips', () => {
    expect(resources.ar.common.status).toMatchObject({
      paid: 'مدفوع',
      due_soon: 'مستحق قريب',
      overdue: 'متأخر',
      awaiting_confirmation: 'في انتظار التأكيد',
    });
  });

  it('defaults to Arabic, which is right-to-left', () => {
    expect(DEFAULT_LOCALE).toBe('ar');
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('en')).toBe(false);
  });
});
