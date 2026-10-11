import { z } from 'zod';

export const ENV = Symbol('ENV');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().nonnegative().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  OTP_SECRET: z.string().min(32),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  WEB_BASE_URL: z.url({ protocol: /^https?$/ }).optional(),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().nonnegative().default(60),
}).transform((env, ctx) => {
  if (env.WEB_BASE_URL !== undefined) return { ...env, WEB_BASE_URL: env.WEB_BASE_URL };
  if (env.NODE_ENV === 'production') {
    ctx.addIssue({ code: 'custom', path: ['WEB_BASE_URL'], message: 'Required in production' });
    return z.NEVER;
  }
  return { ...env, WEB_BASE_URL: 'http://localhost:3001' };
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid environment variables: ${fields}`);
  }
  return result.data;
}
