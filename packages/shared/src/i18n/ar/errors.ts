import type { ErrorCode } from '../../types/errors.js';

export const arErrors: Record<ErrorCode, string> = {
  VALIDATION_FAILED: 'في بيانات ناقصة أو مش مظبوطة',
  UNAUTHORIZED: 'لازم تسجّل دخول الأول',
  TOKEN_INVALID: 'الجلسة خلصت، سجّل دخول تاني',
  NOT_FOUND: 'مش لاقيين اللي بتدوّر عليه',
  OTP_INVALID: 'الكود مش صح',
  OTP_EXPIRED: 'الكود خلص وقته، اطلب كود جديد',
  OTP_TOO_MANY_ATTEMPTS: 'جرّبت كتير، اطلب كود جديد',
  OTP_COOLDOWN: 'استنى دقيقة قبل ما تطلب كود تاني',
  SIGNUP_REQUIRED: 'الرقم ده مش متسجّل، اعمل حساب جديد',
  CONTACT_INVALID: 'الرقم أو الإيميل مش مظبوط',
  RATE_LIMITED: 'طلبات كتير، استنى شوية وجرّب تاني',
  PLAN_LIMIT_REACHED: 'وصلت لأقصى عدد عملاء في باقتك',
  INTERNAL_ERROR: 'حصلت مشكلة، جرّب تاني',
};
