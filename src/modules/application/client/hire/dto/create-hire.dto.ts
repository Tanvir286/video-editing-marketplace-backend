import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  ContentLength,
  JobStatus,
  SoftwarePreference,
  VideoCategory,
} from 'prisma/generated';

export class CreateHireDto {
  @IsString()
  project_title: string;

  @IsEnum(VideoCategory)
  video_category: VideoCategory;

  @IsEnum(ContentLength)
  video_duration: ContentLength;

  @IsString()
  description: string;

  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  project_budget: number;

  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  project_duration: number;

  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  total_amount: number;

  @IsOptional()
  @Transform(({ value }) => {
    // Jodi value string hoy ebong seta array-r moto dekhte hoy
    if (typeof value === 'string') {
      try {
        // String-ke real array-te convert korar jonno JSON.parse use kora hoyeche
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        // Jodi JSON.parse fail kore, tobe manual clean-up logic
        return value
          .replace(/[\[\]"]/g, '') // [, ], " remove korbe
          .split(',')
          .map((item) => item.trim());
      }
    }
    return value;
  })
  @IsArray()
  @IsEnum(SoftwarePreference, { each: true })
  software_preference?: SoftwarePreference[];

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}
