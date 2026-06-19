import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CropsController } from './crops.controller';
import { CropsService } from './crops.service';

@Module({
  imports: [PrismaModule],
  controllers: [CropsController],
  providers: [CropsService],
})
export class CropsModule {}
