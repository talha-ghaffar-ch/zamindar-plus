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

  async getCropProfitability(userId: string) {
    const [expenseByCrop, incomeByCrop, crops] = await Promise.all([
      this.prisma.expense.groupBy({
        by: ['cropId'],
        where: this.userTransactionWhere(userId),
        _sum: {
          amount: true,
        },
        _count: {
          _all: true,
        },
      }),
      this.prisma.income.groupBy({
        by: ['cropId'],
        where: this.userTransactionWhere(userId),
        _sum: {
          totalAmount: true,
        },
        _count: {
          _all: true,
        },
      }),
      this.prisma.crop.findMany({
        where: {
          zameen: {
            profile: {
              userId,
            },
          },
        },
        select: {
          id: true,
          cropName: true,
          status: true,
          zameen: {
            select: {
              zameenName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const expenseMap = new Map(
      expenseByCrop.map((item) => [
        item.cropId,
        {
          totalExpense: item._sum.amount ?? 0,
          expenseCount: item._count._all,
        },
      ]),
    );
    const incomeMap = new Map(
      incomeByCrop.map((item) => [
        item.cropId,
        {
          totalIncome: item._sum.totalAmount ?? 0,
          incomeCount: item._count._all,
        },
      ]),
    );

    return crops.map((crop) => {
      const expense = expenseMap.get(crop.id);
      const income = incomeMap.get(crop.id);
      const totalExpense = expense?.totalExpense ?? 0;
      const totalIncome = income?.totalIncome ?? 0;

      return {
        cropId: crop.id,
        cropName: crop.cropName,
        zameenName: crop.zameen.zameenName,
        status: crop.status,
        totalExpense,
        totalIncome,
        netProfit: totalIncome - totalExpense,
        expenseCount: expense?.expenseCount ?? 0,
        incomeCount: income?.incomeCount ?? 0,
      };
    });
  }

  async getMonthlySummary(userId: string) {
    const [expenseMonthly, incomeMonthly] = await Promise.all([
      this.prisma.expense.groupBy({
        by: ['expenseYear', 'expenseMonth'],
        where: this.userTransactionWhere(userId),
        _sum: {
          amount: true,
        },
        _count: {
          _all: true,
        },
      }),
      this.prisma.income.groupBy({
        by: ['incomeYear', 'incomeMonth'],
        where: this.userTransactionWhere(userId),
        _sum: {
          totalAmount: true,
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const summaries = new Map<
      string,
      {
        year: number;
        month: number;
        totalExpense: number;
        totalIncome: number;
        expenseCount: number;
        incomeCount: number;
      }
    >();

    for (const item of expenseMonthly) {
      const key = this.monthKey(item.expenseYear, item.expenseMonth);
      summaries.set(key, {
        year: item.expenseYear,
        month: item.expenseMonth,
        totalExpense: item._sum.amount ?? 0,
        totalIncome: 0,
        expenseCount: item._count._all,
        incomeCount: 0,
      });
    }

    for (const item of incomeMonthly) {
      const key = this.monthKey(item.incomeYear, item.incomeMonth);
      const existingSummary = summaries.get(key);

      summaries.set(key, {
        year: item.incomeYear,
        month: item.incomeMonth,
        totalExpense: existingSummary?.totalExpense ?? 0,
        totalIncome: item._sum.totalAmount ?? 0,
        expenseCount: existingSummary?.expenseCount ?? 0,
        incomeCount: item._count._all,
      });
    }

    return [...summaries.values()]
      .map((summary) => ({
        ...summary,
        netProfit: summary.totalIncome - summary.totalExpense,
      }))
      .sort((first, second) =>
        first.year === second.year
          ? second.month - first.month
          : second.year - first.year,
      );
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

  private monthKey(year: number, month: number) {
    return `${year}-${month}`;
  }
}
