import { z } from 'zod';
import { BUSINESS_TYPES, CONTACT_CHANNELS, normalizeContact } from '@lamma/shared';

export const contactSchema = z
  .object({ channel: z.enum(CONTACT_CHANNELS), contact: z.string() })
  .superRefine((value, ctx) => {
    if (normalizeContact(value.channel, value.contact)) return;
    ctx.addIssue({
      code: 'custom',
      path: ['contact'],
      message: value.channel === 'phone' ? 'auth:invalidPhone' : 'auth:invalidEmail',
    });
  });

export const signupSchema = z
  .object({
    channel: z.enum(CONTACT_CHANNELS),
    contact: z.string(),
    businessName: z.string().trim().min(2, 'auth:required').max(80),
    businessType: z.enum(BUSINESS_TYPES),
    instapayAddress: z.string().trim().min(3, 'auth:required').max(120),
  })
  .superRefine((value, ctx) => {
    const check = contactSchema.safeParse(value);
    if (!check.success) for (const issue of check.error.issues) ctx.addIssue({ ...issue, code: 'custom' });
  });

export type SignupValues = z.infer<typeof signupSchema>;
