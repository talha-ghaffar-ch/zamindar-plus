import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';

@Injectable()
export class IncomeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createIncomeDto: CreateIncomeDto) {
    await this.assertCropOwnedByUser(userId, createIncomeDto.cropId);

    return this.prisma.income.create({
      data: createIncomeDto,
    });
  }

  findAll(userId: string) {
    return this.prisma.income.findMany({
      where: this.userIncomeWhere(userId),
      orderBy: {
        incomeDate: 'desc',
      },
    });
  }

  async findByCrop(userId: string, cropId: string) {
    await this.assertCropOwnedByUser(userId, cropId);

    return this.prisma.income.findMany({
      where: {
        cropId,
      },
      orderBy: {
        incomeDate: 'desc',
      },
    });
  }

  findByMonth(userId: string, year: number, month: number) {
    return this.prisma.income.findMany({
      where: {
        ...this.userIncomeWhere(userId),
        incomeYear: year,
        incomeMonth: month,
      },
      orderBy: {
        incomeDate: 'desc',
      },
    });
  }

  async update(userId: string, id: string, updateIncomeDto: UpdateIncomeDto) {
    const income = await this.prisma.income.findFirst({
      where: {
        id,
        ...this.userIncomeWhere(userId),
      },
      select: {
        id: true,
      },
    });

    if (!income) {
      throw new NotFoundException('Income not found.');
    }

    if (updateIncomeDto.cropId) {
      await this.assertCropOwnedByUser(userId, updateIncomeDto.cropId);
    }

    return this.prisma.income.update({
      where: {
        id,
      },
      data: updateIncomeDto,
    });
  }

  async remove(userId: string, id: string) {
    const income = await this.prisma.income.findFirst({
      where: {
        id,
        ...this.userIncomeWhere(userId),
      },
      select: {
        id: true,
      },
    });

    if (!income) {
      throw new NotFoundException('Income not found.');
    }

    await this.prisma.income.delete({
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

  private userIncomeWhere(userId: string) {
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
