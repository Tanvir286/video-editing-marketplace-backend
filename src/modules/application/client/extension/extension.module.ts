import { Module } from '@nestjs/common';
import { ExtensionService } from './extension.service';
import { ExtensionController } from './extension.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExtensionController],
  providers: [ExtensionService],
})
export class ExtensionModule {}
