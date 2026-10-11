import { type CustomerUpdate, type Gender, GENDERS } from '@lamma/shared';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { IsOptionalNotNull } from '../../../common/validation/optional-not-null.js';
import { trim } from '../../../common/validation/trim.js';

export class UpdateCustomerDto implements CustomerUpdate {
  @IsOptionalNotNull()
  @Transform(trim)
  @IsString()
  @Length(1, 80)
  name?: string;

  @IsOptionalNotNull()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  note?: string | null;

  @IsOptional()
  @IsIn([...GENDERS])
  gender?: Gender | null;
}
