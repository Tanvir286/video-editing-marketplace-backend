import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBidDto {
  @ApiProperty({
    example: 250,
    required: false,
    description: 'Bid amount proposed by the editor',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  amount?: number;

  @ApiProperty({
    example: 3,
    required: false,
    description: 'Requested delivery time in days',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  req_date?: number;

  @ApiProperty({
    example: 'I can complete this project within 3 days.',
    required: false,
    description: 'Message sent with the bid',
  })
  @IsString()
  @IsOptional()
  message?: string;
}