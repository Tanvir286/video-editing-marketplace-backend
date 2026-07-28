import { Module } from '@nestjs/common';
import { ExtensionService } from './extension.service';
import { ExtensionController } from './extension.controller';

@Module({
  controllers: [ExtensionController],
  providers: [ExtensionService],
})
export class ExtensionModule {}
