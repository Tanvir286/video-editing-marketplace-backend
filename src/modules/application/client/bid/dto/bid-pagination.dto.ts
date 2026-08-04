import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { BidStatus } from 'prisma/generated';

export class BidClientPaginationDto {

  @ApiPropertyOptional({
    default: 1,
    description: 'Page number',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    default: 10,
    description: 'Items per page',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: BidStatus,
    description: 'Filters bids by status. Leave empty to return all statuses.',
    example: BidStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(BidStatus)
  status?: BidStatus;


} 