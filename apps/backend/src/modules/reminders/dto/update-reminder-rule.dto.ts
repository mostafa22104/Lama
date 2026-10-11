import type { ReminderRuleDto } from '@lamma/shared';
import { IsBoolean, IsInt, Max, Min, ValidateIf } from 'class-validator';

/** Every field is required; offsets may be null to switch them off. */
export class UpdateReminderRuleDto implements ReminderRuleDto {
  @ValidateIf((o: UpdateReminderRuleDto) => o.beforeDays !== null)
  @IsInt()
  @Min(1)
  @Max(7)
  beforeDays: number | null;

  @IsBoolean()
  onDueDate: boolean;

  @ValidateIf((o: UpdateReminderRuleDto) => o.afterDays !== null)
  @IsInt()
  @Min(1)
  @Max(30)
  afterDays: number | null;
}
