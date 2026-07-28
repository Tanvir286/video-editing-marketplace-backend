import { Module } from '@nestjs/common';
import { JobsService } from './job.service';
import { JobsController } from 'src/modules/application/client/job/job.controller';

@Module({
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobModule {}
