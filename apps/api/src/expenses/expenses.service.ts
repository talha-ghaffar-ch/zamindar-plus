import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createExpenseDto: CreateExpenseDto) {
    const crop = await this.prisma.crop.findUnique({
      where: {
        id: createExpenseDto.cropId,
      },
      select: {
        id: true,
      },
    });

    if (!crop) {
      throw new NotFoundException('Crop not found.');
    }

    return this.prisma.expense.create({
      data: createExpenseDto,
    });
  }

  findAll() {
    return this.prisma.expense.findMany({
      orderBy: {
        expenseDate: 'desc',
      },
    });
  }

  findByCrop(cropId: string) {
    return this.prisma.expense.findMany({
      where: {
        cropId,
      },
      orderBy: {
        expenseDate: 'desc',
      },
    });
  }

  findByMonth(year: number, month: number) {
    return this.prisma.expense.findMany({
      where: {
        expenseYear: year,
        expenseMonth: month,
      },
      orderBy: {
        expenseDate: 'desc',
      },
    });
  }
}
