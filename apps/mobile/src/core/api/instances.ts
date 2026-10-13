import { API_BASE_URL } from '../config/api-base-url';
import { createApiClient, createPublicClient } from './client';

/** Authenticated calls (bearer + refresh). */
export const api = createApiClient(API_BASE_URL);
/** Calls that must never trigger a refresh (refresh/logout themselves). */
export const publicApi = createPublicClient(API_BASE_URL);
