import { Module } from '@nestjs/common';
import { ClientModule } from './client/client.module';
import { EditorModule } from './editor/editor.module';
import { NotificationModule } from './notification/notification.module';
import { ReviewModule } from './review/review.module';

@Module({
  imports: [
    NotificationModule,
    EditorModule,
    ClientModule,
    ReviewModule,
  ],
})
export class ApplicationModule {}
