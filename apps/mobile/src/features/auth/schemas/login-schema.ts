import type { z } from 'zod';
import { contactSchema } from './signup-schema';

export const loginSchema = contactSchema;
export type LoginValues = z.infer<typeof loginSchema>;
