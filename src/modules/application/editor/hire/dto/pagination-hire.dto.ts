// src/common/pagination/pagination.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { HireStatus } from 'prisma/generated';

export class HirePaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  // ✅ Add status filter in DTO (optional)
  @ApiPropertyOptional({ enum: HireStatus })
  @IsOptional()
  @IsEnum(HireStatus)
  status?: HireStatus;
}