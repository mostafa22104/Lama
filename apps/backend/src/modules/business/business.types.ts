import type { BusinessType, ContactChannel } from '@lamma/shared';

export interface NewBusinessInput {
  channel: ContactChannel;
  /** Already normalized (E.164 phone or lowercased email). */
  contact: string;
  businessName: string;
  businessType: BusinessType;
  instapayAddress: string;
}
