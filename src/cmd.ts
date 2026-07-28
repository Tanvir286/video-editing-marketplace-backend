// external imports
import { Module } from '@nestjs/common';
import { CommandFactory } from 'nest-commander';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
// internal imports
import { PrismaModule } from './prisma/prisma.module';
import { RepositoryModule } from './common/repository/repository.module';
import { SeedCommand } from './command/seed.command';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    PrismaModule,
    RepositoryModule,
  ],
  providers: [SeedCommand],
})
export class AppModule {}

import * as fs from 'fs';

async function bootstrap() {
  try {
    fs.writeFileSync('seeding.log', 'CMD.TS: Bootstrapping commander...\n');
    await CommandFactory.run(AppModule);
    fs.writeFileSync('seeding.log', 'CMD.TS: Commander run completed.\n', { flag: 'a' });
  } catch (error) {
    fs.writeFileSync('seeding.log', `CMD.TS BOOTSTRAP ERROR: ${error.stack || error}\n`, { flag: 'a' });
  }
}

bootstrap();
