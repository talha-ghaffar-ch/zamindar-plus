import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ZameenController } from './zameen.controller';
import { ZameenService } from './zameen.service';

@Module({
  imports: [PrismaModule],
  controllers: [ZameenController],
  providers: [ZameenService],
})
export class ZameenModule {}
