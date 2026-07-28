import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { JobStatus } from 'prisma/generated';
import { ClientCreateJobDto } from './create-job.dto';

export class ClientUpdateJobDto extends PartialType(ClientCreateJobDto) {
  @ApiPropertyOptional({
    description: 'Job status',
    enum: JobStatus,
    example: JobStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(JobStatus)    
  status?: JobStatus;
}

