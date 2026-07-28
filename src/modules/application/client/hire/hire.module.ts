import { Module } from '@nestjs/common';
import { HireService } from './hire.service';
import { HireController } from './hire.controller';

@Module({
  controllers: [HireController],
  providers: [HireService],
})
export class HireModule {}
