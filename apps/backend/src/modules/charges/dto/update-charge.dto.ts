import type { ChargeUpdate } from '@lamma/shared';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { trim } from '../../../common/validation/trim.js';

export class UpdateChargeDto implements ChargeUpdate {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 60)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  amount?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
