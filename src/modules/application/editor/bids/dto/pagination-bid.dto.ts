// src/common/pagination/pagination.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { BidStatus } from 'prisma/generated';

export class BidPaginationDto {
  @ApiPropertyOptional({ 
    default: 1,
    description: 'Page number' 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    default: 10,
    description: 'Items per page' 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ 
    enum: BidStatus,
    description: 'Filter by bid status (PENDING, APPROVED, REJECT, IN_PROGRESS, CANCELLED, ACCEPTED)',
  })
  @IsOptional()
  @IsEnum(BidStatus)
  status?: BidStatus;
}