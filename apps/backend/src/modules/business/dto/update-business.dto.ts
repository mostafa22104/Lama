import type { BusinessUpdate } from '@lamma/shared';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { IsOptionalNotNull } from '../../../common/validation/optional-not-null.js';
import { trim } from '../../../common/validation/trim.js';

export class UpdateBusinessDto implements BusinessUpdate {
  @IsOptionalNotNull()
  @Transform(trim)
  @IsString()
  @Length(2, 80)
  name?: string;

  @IsOptionalNotNull()
  @Transform(trim)
  @IsString()
  @Length(3, 120)
  instapayAddress?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  area?: string | null;

  @IsOptionalNotNull()
  @IsBoolean()
  weeklyBackup?: boolean;
}
