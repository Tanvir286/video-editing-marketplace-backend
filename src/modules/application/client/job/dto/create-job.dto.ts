import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContentLength, JobCategory, Platform } from 'prisma/generated';

export class ClientCreateJobDto {
  @ApiPropertyOptional({ description: 'Job title', example: 'Need a landing page' })
  @IsOptional()
  @IsString()
  job_title?: string;

  @ApiPropertyOptional({ description: 'Job description', example: 'Create a modern landing page' })
  @IsOptional()
  @IsString()
  job_description?: string;

  @ApiPropertyOptional({ description: 'Job photo URL or filename', example: 'job-photo.jpg' })
  @IsOptional()
  @IsString()
  job_photo?: string;

  @ApiPropertyOptional({ description: 'Content length', enum: ContentLength, example: ContentLength.MIN_1_5 })
  @IsEnum(ContentLength)
  content_length: ContentLength;

  @ApiPropertyOptional({ description: 'Project budget', example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  project_budget?: number;

  @ApiPropertyOptional({ description: 'Job category', enum: JobCategory, example: JobCategory.LONG_FORM_VIDEO })
  @IsEnum(JobCategory)
  job_category: JobCategory;

  @ApiPropertyOptional({ description: 'Project duration in days', example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  project_duration?: number;

  @ApiPropertyOptional({ description: 'Platform', enum: Platform, example: Platform.YOUTUBE })
  @IsEnum(Platform)
  platform: Platform;

  @ApiPropertyOptional({ description: 'Skills required', example: 'NestJS, React' })
  @IsOptional()
  @IsString()
  skill?: string;

  @ApiPropertyOptional({ description: 'Reference link or note', example: 'https://example.com/reference' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Total payment amount', example: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  total_payment?: number;

  @ApiPropertyOptional({ description: 'Attachment IDs', example: ['att-1', 'att-2'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
