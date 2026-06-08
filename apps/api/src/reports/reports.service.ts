import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const [
      expenseAggregate,
      incomeAggregate,
      zameenCount,
      cropCount,
      expenseCount,
      incomeCount,
    ] = await Promise.all([
      this.prisma.expense.aggregate({
        where: this.userTransactionWhere(userId),
        _sum: {
          amount: true,
        },
      }),
      this.prisma.income.aggregate({
        where: this.userTransactionWhere(userId),
        _sum: {
          totalAmount: true,
        },
      }),
      this.prisma.zameen.count({
        where: {
          profile: {
            userId,
          },
        },
      }),
      this.prisma.crop.count({
        where: {
          zameen: {
            profile: {
              userId,
            },
          },
        },
      }),
      this.prisma.expense.count({
        where: this.userTransactionWhere(userId),
      }),
      this.prisma.income.count({
        where: this.userTransactionWhere(userId),
      }),
    ]);

    const totalExpense = expenseAggregate._sum.amount ?? 0;
    const totalIncome = incomeAggregate._sum.totalAmount ?? 0;

    return {
      totalExpense,
      totalIncome,
      netProfit: totalIncome - totalExpense,
      zameenCount,
      cropCount,
      expenseCount,
      incomeCount,
    };
  }

  private userTransactionWhere(userId: string) {
    return {
      crop: {
        zameen: {
          profile: {
            userId,
          },
        },
      },
    };
  }
}
