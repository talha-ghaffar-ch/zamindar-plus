import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ZameenModule } from './zameen/zameen.module';
import { CropsModule } from './crops/crops.module';
import { ExpensesModule } from './expenses/expenses.module';
import { IncomeModule } from './income/income.module';
import { ReportsModule } from './reports/reports.module';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    ProfilesModule,
    ZameenModule,
    CropsModule,
    ExpensesModule,
    IncomeModule,
    ReportsModule,
    AuthModule,
    AiModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
