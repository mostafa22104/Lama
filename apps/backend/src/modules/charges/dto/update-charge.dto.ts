import type { ChargeUpdate } from '@lamma/shared';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsString, Length, Max, Min } from 'class-validator';
import { IsOptionalNotNull } from '../../../common/validation/optional-not-null.js';
import { trim } from '../../../common/validation/trim.js';

export class UpdateChargeDto implements ChargeUpdate {
  @IsOptionalNotNull()
  @Transform(trim)
  @IsString()
  @Length(1, 60)
  title?: string;

  @IsOptionalNotNull()
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  amount?: number;

  @IsOptionalNotNull()
  @IsBoolean()
  active?: boolean;
}
