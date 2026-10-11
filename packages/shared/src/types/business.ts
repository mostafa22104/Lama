import type { Plan } from '../domain/plans.js';

export const BUSINESS_TYPES = ['academy', 'building', 'tutor', 'nursery', 'other'] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export interface BusinessDto {
  id: string;
  name: string;
  type: BusinessType;
  instapayAddress: string;
  phone: string | null;
  email: string | null;
  plan: Plan;
  logoUrl: string | null;
  area: string | null;
  weeklyBackup: boolean;
}
