import type { IsoDate } from '../domain/dates.js';

export const CHARGE_KINDS = ['monthly', 'one_time'] as const;
export type ChargeKind = (typeof CHARGE_KINDS)[number];

export const CHARGE_ASSIGNMENTS = ['all', 'selected'] as const;
export type ChargeAssignment = (typeof CHARGE_ASSIGNMENTS)[number];

export interface ChargeInput {
  kind: ChargeKind;
  /** Required for one_time; monthly defaults to DEFAULT_MONTHLY_TITLE. */
  title?: string;
  amount: number;
  /** Required for monthly (1–31). */
  dayOfMonth?: number;
  /** Required for one_time. */
  dueDate?: IsoDate;
  assignTo: ChargeAssignment;
  /** Required when assignTo is 'selected'. */
  customerIds?: string[];
}

export interface ChargeUpdate {
  title?: string;
  amount?: number;
  active?: boolean;
}

export interface ChargeDto {
  id: string;
  kind: ChargeKind;
  title: string;
  amount: number;
  dayOfMonth: number | null;
  dueDate: IsoDate | null;
  active: boolean;
  customerCount: number;
  createdAt: string;
}
