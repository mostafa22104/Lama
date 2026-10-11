import { CONTACT_CHANNELS, type ContactChannel, type OtpRequestBody } from '@lamma/shared';
import { IsIn, IsString, MaxLength } from 'class-validator';

export class OtpRequestDto implements OtpRequestBody {
  @IsIn([...CONTACT_CHANNELS])
  channel: ContactChannel;

  @IsString()
  @MaxLength(254)
  contact: string;
}
