import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ZameenModule } from './zameen/zameen.module';
import { CropsModule } from './crops/crops.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    ProfilesModule,
    ZameenModule,
    CropsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
