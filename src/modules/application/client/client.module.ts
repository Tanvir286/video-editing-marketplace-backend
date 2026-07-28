import { Module } from '@nestjs/common';
import { HireModule } from './hire/hire.module';
import { JobModule } from './job/job.module';

@Module({
  imports: [HireModule, JobModule],
})
export class ClientModule {}
