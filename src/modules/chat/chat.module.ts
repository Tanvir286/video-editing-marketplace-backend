import { Module } from '@nestjs/common';
import { ConversationModule } from './conversation/conversation.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [ConversationModule, UserModule],
})
export class ChatModule {}
