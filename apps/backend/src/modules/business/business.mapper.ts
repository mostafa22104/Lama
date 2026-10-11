import type { BusinessDto } from '@lamma/shared';
import type { Business } from '../../generated/prisma/client.js';

export function toBusinessDto(business: Business): BusinessDto {
  return {
    id: business.id,
    name: business.name,
    type: business.type,
    instapayAddress: business.instapayAddress,
    phone: business.phone,
    email: business.email,
    plan: business.plan,
    logoUrl: business.logoUrl,
    area: business.area,
    weeklyBackup: business.weeklyBackup,
  };
}
