import type { ContactChannel } from '../domain/contact.js';
import type { BusinessDto, BusinessType } from './business.js';

export interface SignupDetails {
  businessName: string;
  businessType: BusinessType;
  instapayAddress: string;
}

export interface OtpRequestBody {
  channel: ContactChannel;
  contact: string;
}

export interface OtpVerifyBody extends OtpRequestBody {
  code: string;
  signup?: SignupDetails;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Seconds until the access token expires. */
  accessTokenExpiresIn: number;
}

export interface AuthResponse {
  business: BusinessDto;
  tokens: AuthTokens;
  isNewBusiness: boolean;
}
