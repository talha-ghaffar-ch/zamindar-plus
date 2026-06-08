import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCropDto } from './dto/create-crop.dto';

@Injectable()
export class CropsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCropDto: CreateCropDto) {
    const zameen = await this.prisma.zameen.findUnique({
      where: {
        id: createCropDto.zameenId,
      },
      select: {
        id: true,
        totalAreaSqft: true,
      },
    });

    if (!zameen) {
      throw new NotFoundException('Zameen not found.');
    }

    const existingCrops = await this.prisma.crop.findMany({
      where: {
        zameenId: createCropDto.zameenId,
      },
      select: {
        cropAreaSqft: true,
      },
    });

    const usedAreaSqft = existingCrops.reduce(
      (total, crop) => total + crop.cropAreaSqft,
      0,
    );

    if (usedAreaSqft + createCropDto.cropAreaSqft > zameen.totalAreaSqft) {
      throw new BadRequestException(
        'Crop area cannot exceed available zameen area.',
      );
    }

    return this.prisma.crop.create({
      data: createCropDto,
    });
  }

  findAll() {
    return this.prisma.crop.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findByZameen(zameenId: string) {
    return this.prisma.crop.findMany({
      where: {
        zameenId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async remove(id: string) {
    const crop = await this.prisma.crop.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!crop) {
      throw new NotFoundException('Crop not found.');
    }

    await this.prisma.crop.delete({
      where: {
        id,
      },
    });

    return {
      deleted: true,
      id,
    };
  }
}
