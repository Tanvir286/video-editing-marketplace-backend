import { Module } from '@nestjs/common';
import { HireModule } from './hire/hire.module';
import { JobModule } from './job/job.module';
import { BidModule } from './bid/bid.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExtensionModule } from './extension/extension.module';

@Module({
  imports: [HireModule, JobModule, BidModule, DashboardModule, ExtensionModule],
})
export class ClientModule {}
