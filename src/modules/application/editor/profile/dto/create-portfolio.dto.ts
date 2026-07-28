import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePortfolioDto {
 
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  project_type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
