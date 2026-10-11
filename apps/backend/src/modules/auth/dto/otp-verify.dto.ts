import { type OtpVerifyBody, toWesternDigits } from '@lamma/shared';
import { Transform, Type } from 'class-transformer';
import { IsOptional, Matches, ValidateNested } from 'class-validator';
import { OtpRequestDto } from './otp-request.dto.js';
import { SignupDetailsDto } from './signup-details.dto.js';

export class OtpVerifyDto extends OtpRequestDto implements OtpVerifyBody {
  /** Owners on an Arabic keyboard type ١٢٣٤٥٦; accept it as 123456. */
  @Transform(({ value }) => (typeof value === 'string' ? toWesternDigits(value.trim()) : value))
  @Matches(/^\d{6}$/)
  code: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SignupDetailsDto)
  signup?: SignupDetailsDto;
}
