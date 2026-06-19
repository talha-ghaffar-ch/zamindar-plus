import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createExpenseDto: CreateExpenseDto) {
    await this.assertCropOwnedByUser(userId, createExpenseDto.cropId);

    return this.prisma.expense.create({
      data: createExpenseDto,
    });
  }

  findAll(userId: string) {
    return this.prisma.expense.findMany({
      where: this.userExpenseWhere(userId),
      orderBy: {
        expenseDate: 'desc',
      },
    });
  }

  async findByCrop(userId: string, cropId: string) {
    await this.assertCropOwnedByUser(userId, cropId);

    return this.prisma.expense.findMany({
      where: {
        cropId,
      },
      orderBy: {
        expenseDate: 'desc',
      },
    });
  }

  findByMonth(userId: string, year: number, month: number) {
    return this.prisma.expense.findMany({
      where: {
        ...this.userExpenseWhere(userId),
        expenseYear: year,
        expenseMonth: month,
      },
      orderBy: {
        expenseDate: 'desc',
      },
    });
  }

  async update(userId: string, id: string, updateExpenseDto: UpdateExpenseDto) {
    const expense = await this.prisma.expense.findFirst({
      where: {
        id,
        ...this.userExpenseWhere(userId),
      },
      select: {
        id: true,
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found.');
    }

    if (updateExpenseDto.cropId) {
      await this.assertCropOwnedByUser(userId, updateExpenseDto.cropId);
    }

    return this.prisma.expense.update({
      where: {
        id,
      },
      data: updateExpenseDto,
    });
  }

  async remove(userId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: {
        id,
        ...this.userExpenseWhere(userId),
      },
      select: {
        id: true,
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found.');
    }

    await this.prisma.expense.delete({
      where: {
        id,
      },
    });

    return {
      deleted: true,
      id,
    };
  }

  private async assertCropOwnedByUser(userId: string, cropId: string) {
    const crop = await this.prisma.crop.findFirst({
      where: {
        id: cropId,
        zameen: {
          profile: {
            userId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!crop) {
      throw new NotFoundException('Crop not found.');
    }
  }

  private userExpenseWhere(userId: string) {
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
