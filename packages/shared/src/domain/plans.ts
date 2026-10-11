export const PLANS = ['free', 'basic', 'pro'] as const;
export type Plan = (typeof PLANS)[number];

export interface PlanLimits {
  maxCustomers: number;
  priceEgp: number;
  autoWhatsApp: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: { maxCustomers: 20, priceEgp: 0, autoWhatsApp: false },
  basic: { maxCustomers: 150, priceEgp: 199, autoWhatsApp: false },
  pro: { maxCustomers: 500, priceEgp: 399, autoWhatsApp: true },
};

export function canAddCustomers(plan: Plan, currentCount: number, adding: number): boolean {
  return currentCount + adding <= PLAN_LIMITS[plan].maxCustomers;
}
