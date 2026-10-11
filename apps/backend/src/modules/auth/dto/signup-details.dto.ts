import { BUSINESS_TYPES, type BusinessType, type SignupDetails } from '@lamma/shared';
import { Transform } from 'class-transformer';
import { IsIn, IsString, Length } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class SignupDetailsDto implements SignupDetails {
  @Transform(trim)
  @IsString()
  @Length(2, 80)
  businessName: string;

  @IsIn([...BUSINESS_TYPES])
  businessType: BusinessType;

  @Transform(trim)
  @IsString()
  @Length(3, 120)
  instapayAddress: string;
}
