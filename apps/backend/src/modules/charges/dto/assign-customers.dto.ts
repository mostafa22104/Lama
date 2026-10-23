import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

export class AssignCustomersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsString({ each: true })
  customerIds: string[];
}
