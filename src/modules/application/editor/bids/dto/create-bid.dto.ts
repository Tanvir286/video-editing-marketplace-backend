import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBidDto {
  @ApiPropertyOptional({
    description: 'Bid amount proposed by the editor',
    example: 250,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Requested delivery time in days',
    example: 3,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  req_date?: number;

  @ApiPropertyOptional({
    description: 'Message sent with the bid',
    example: 'I can complete this project within 3 days.',
  })
  @IsString()
  @IsOptional()
  message?: string;
}