import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentLength, JobCategory, Platform } from 'prisma/generated';

export class ClientCreateJobDto {
  @ApiPropertyOptional({
    description: 'Job title',
    example: 'Need a video editor for YouTube shorts',
  })
  @IsOptional()
  @IsString()
  job_title?: string;

  @ApiPropertyOptional({
    description: 'Detailed job description',
    example: 'We need a professional editor for a short-form video campaign.',
  })
  @IsOptional()
  @IsString()
  job_description?: string;

  @ApiProperty({
    description: 'Job category',
    enum: JobCategory,
    example: JobCategory.SHORTS_REELS_TIKTOKS,
  })
  @IsEnum(JobCategory)
  job_category: JobCategory;

  @ApiPropertyOptional({
    description: 'Skills required for the job',
    example: 'Adobe Premiere Pro, After Effects',
  })
  @IsOptional()
  @IsString()
  job_skill?: string;

  @ApiProperty({
    description: 'Budget for the job',
    example: 500,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  job_budget: number;

  @ApiPropertyOptional({
    description: 'Estimated project duration in days',
    example: 7,
  })
  @IsOptional()
  @IsNumber()
  job_duration?: number;

  @ApiProperty({
    description: 'Expected content length',
    enum: ContentLength,
    example: ContentLength.MIN_5_10,
  })
  @IsEnum(ContentLength)
  job_content_length: ContentLength;

  @ApiProperty({
    description: 'Target platform',
    enum: Platform,
    example: Platform.YOUTUBE,
  })
  @IsEnum(Platform)
  job_platform: Platform;
}
