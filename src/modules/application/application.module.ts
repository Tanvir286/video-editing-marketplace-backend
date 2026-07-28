import { Module } from '@nestjs/common';
import { ClientModule } from './client/client.module';
import { ContactModule } from './contact/contact.module';
import { EditorModule } from './editor/editor.module';
import { FaqModule } from './faq/faq.module';
import { NotificationModule } from './notification/notification.module';
import { ReviewModule } from './review/review.module';

@Module({
  imports: [
    NotificationModule,
    ContactModule,
    FaqModule,
    EditorModule,
    ClientModule,
    ReviewModule,
  ],
})
export class ApplicationModule {}
