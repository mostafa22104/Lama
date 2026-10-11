import { type CustomerUpdate, type Gender, GENDERS } from '@lamma/shared';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { trim } from '../../../common/validation/trim.js';

export class UpdateCustomerDto implements CustomerUpdate {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 80)
  name?: string;

  @IsOptional()
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
