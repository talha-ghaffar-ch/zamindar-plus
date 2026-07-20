import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CropsService } from '../crops/crops.service';
import { ExpensesService } from '../expenses/expenses.service';
import { IncomeService } from '../income/income.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfilesService } from '../profiles/profiles.service';
import { ReportsService } from '../reports/reports.service';
import { ZameenService } from '../zameen/zameen.service';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AiController],
  providers: [
    AiService,
    ProfilesService,
    ZameenService,
    CropsService,
    ExpensesService,
    IncomeService,
    ReportsService,
  ],
})
export class AiModule {}
