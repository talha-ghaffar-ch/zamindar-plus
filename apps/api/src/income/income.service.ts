import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncomeDto } from './dto/create-income.dto';

@Injectable()
export class IncomeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createIncomeDto: CreateIncomeDto) {
    const crop = await this.prisma.crop.findUnique({
      where: {
        id: createIncomeDto.cropId,
      },
      select: {
        id: true,
      },
    });

    if (!crop) {
      throw new NotFoundException('Crop not found.');
    }

    return this.prisma.income.create({
      data: createIncomeDto,
    });
  }

  findAll() {
    return this.prisma.income.findMany({
      orderBy: {
        incomeDate: 'desc',
      },
    });
  }

  findByCrop(cropId: string) {
    return this.prisma.income.findMany({
      where: {
        cropId,
      },
      orderBy: {
        incomeDate: 'desc',
      },
    });
  }

  findByMonth(year: number, month: number) {
    return this.prisma.income.findMany({
      where: {
        incomeYear: year,
        incomeMonth: month,
      },
      orderBy: {
        incomeDate: 'desc',
      },
    });
  }
}
