import { type MarkSentInput, REMINDER_KINDS, type ReminderKind } from '@lamma/shared';
import { IsIn } from 'class-validator';

export class MarkSentDto implements MarkSentInput {
  @IsIn([...REMINDER_KINDS])
  kind: ReminderKind;
}
