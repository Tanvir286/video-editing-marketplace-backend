import { Module } from '@nestjs/common';
import { HireModule } from './hire/hire.module';
import { JobModule } from './job/job.module';
import { BidModule } from './bid/bid.module';

@Module({
  imports: [HireModule, JobModule, BidModule],
})
export class ClientModule {}
