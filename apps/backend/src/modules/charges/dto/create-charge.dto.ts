import { CHARGE_ASSIGNMENTS, CHARGE_COLLECTION_TIMINGS, CHARGE_KINDS, type ChargeAssignment, type ChargeInput, type ChargeKind } from '@lamma/shared';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';
import { trim } from '../../../common/validation/trim.js';

export class CreateChargeDto implements ChargeInput {
  @IsIn([...CHARGE_KINDS])
  kind: ChargeKind;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 60)
  title?: string;

  @IsInt()
  @Min(1)
  @Max(1_000_000)
  amount: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueDate?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @IsOptional()
  @IsIn([...CHARGE_COLLECTION_TIMINGS])
  collectionTiming?: (typeof CHARGE_COLLECTION_TIMINGS)[number];

  @IsIn([...CHARGE_ASSIGNMENTS])
  assignTo: ChargeAssignment;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  customerIds?: string[];
}
