import { initI18n } from '../i18n';

describe('initI18n', () => {
  it('starts synchronously with shared resources and interpolation', () => {
    const i18n = initI18n('ar');
    expect(i18n.t('auth:continue')).toBe('كمّل');
    expect(i18n.t('auth:stepOf', { step: 1, total: 4 })).toBe('خطوة 1 من 4');
    expect(i18n.t('errors:OTP_INVALID')).toBe('الكود مش صح');
  });

  it('is idempotent and switches language', async () => {
    const i18n = initI18n('en');
    await i18n.changeLanguage('en');
    expect(i18n.t('auth:continue')).toBe('Continue');
    expect(initI18n('ar')).toBe(i18n);
  });
});
