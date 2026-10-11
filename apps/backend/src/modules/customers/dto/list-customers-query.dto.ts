import { INVOICE_STATUSES, type InvoiceStatus } from '@lamma/shared';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { trim } from '../../../common/validation/trim.js';

export class ListCustomersQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  search?: string;

  @IsOptional()
  @IsIn([...INVOICE_STATUSES])
  status?: InvoiceStatus;
}
