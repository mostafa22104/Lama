import type { Business, Prisma } from '../../src/generated/prisma/client.js';
import type { PrismaService } from '../../src/infra/prisma/prisma.service.js';

export function createBusiness(
  prisma: PrismaService,
  overrides: Partial<Prisma.BusinessCreateInput> = {},
): Promise<Business> {
  return prisma.business.create({
    data: {
      name: 'أكاديمية النجوم للكرة',
      type: 'academy',
      instapayAddress: 'nogoum.academy@instapay',
      phone: '+201012345678',
      ...overrides,
    },
  });
}
