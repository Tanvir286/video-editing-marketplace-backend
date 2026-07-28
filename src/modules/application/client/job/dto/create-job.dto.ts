import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ContentLength, JobCategory, Platform } from 'prisma/generated';

export class CreateJobDto {
  @IsOptional()
  @IsString()
  job_title?: string;

  @IsOptional()
  @IsString()
  job_description?: string;

  @IsOptional()
  @IsString()
  job_photo?: string;

  @IsEnum(ContentLength)
  content_length: ContentLength;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  project_budget?: number;

  @IsEnum(JobCategory)
  job_category: JobCategory;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  project_duration?: number;

  @IsEnum(Platform)
  platform: Platform;

  @IsOptional()
  @IsString()
  skill?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  total_payment?: number;

  //  Attachment IDs (many-to-many)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
