import { Module } from '@nestjs/common';
import { ProfileModule } from './profile/profile.module';
import { BidsModule } from './bids/bids.module';
import { DeliveryModule } from './delivery/delivery.module';
import { ExtensionModule } from './extension/extension.module';
import { JobModule } from './job/job.module';
import { DashboardModule } from './dashboard/dashboard.module';


@Module({

  imports: [ProfileModule, BidsModule, DeliveryModule, ExtensionModule, JobModule, DashboardModule]
})
export class EditorModule {}
