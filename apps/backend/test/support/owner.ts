import type { Business, Prisma } from '../../src/generated/prisma/client.js';
import { AccessTokenService } from '../../src/common/auth/access-token.service.js';
import type { TestApp } from './create-test-app.js';
import { createBusiness } from './factories.js';

/** Supertest calls under /api/v1 that carry the business owner's access token. */
export function ownerApi(t: TestApp, businessId: string) {
  const auth = `Bearer ${t.app.get(AccessTokenService).sign(businessId)}`;
  const url = (path: string) => `/api/v1${path}`;
  return {
    get: (path: string) => t.api().get(url(path)).set('Authorization', auth),
    post: (path: string, body: object = {}) => t.api().post(url(path)).set('Authorization', auth).send(body),
    patch: (path: string, body: object = {}) => t.api().patch(url(path)).set('Authorization', auth).send(body),
    put: (path: string, body: object = {}) => t.api().put(url(path)).set('Authorization', auth).send(body),
    delete: (path: string) => t.api().delete(url(path)).set('Authorization', auth),
  };
}

export type OwnerApi = ReturnType<typeof ownerApi>;

export async function createOwner(
  t: TestApp,
  overrides: Partial<Prisma.BusinessCreateInput> = {},
): Promise<{ business: Business; api: OwnerApi }> {
  const business = await createBusiness(t.prisma, overrides);
  return { business, api: ownerApi(t, business.id) };
}
