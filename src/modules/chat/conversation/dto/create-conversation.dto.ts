import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateConversationDto {
 
  @IsNotEmpty()
  @IsString()
  participant_id: string;
  
}
