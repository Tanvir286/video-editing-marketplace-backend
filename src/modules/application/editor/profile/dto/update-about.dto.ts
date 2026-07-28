import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAboutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  about_me?: string;
}
