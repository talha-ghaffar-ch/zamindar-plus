import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [expenseAggregate, incomeAggregate] = await Promise.all([
      this.prisma.expense.aggregate({
        _sum: {
          amount: true,
        },
      }),
      this.prisma.income.aggregate({
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    const totalExpense = expenseAggregate._sum.amount ?? 0;
    const totalIncome = incomeAggregate._sum.totalAmount ?? 0;

    return {
      totalExpense,
      totalIncome,
      netProfit: totalIncome - totalExpense,
    };
  }
}
