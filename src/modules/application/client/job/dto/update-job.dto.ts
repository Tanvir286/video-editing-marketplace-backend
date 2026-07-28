import { PartialType } from '@nestjs/mapped-types';
import { CreateJobDto } from './create-job.dto';
import { JobStatus } from 'prisma/generated';


export class   UpdateJobDto extends PartialType(CreateJobDto) {
  status: JobStatus;
}
