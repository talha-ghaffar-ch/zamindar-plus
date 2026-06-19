import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';

@Injectable()
export class CropsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createCropDto: CreateCropDto) {
    await this.assertCropAreaFits(
      userId,
      createCropDto.zameenId,
      createCropDto.cropAreaSqft,
    );

    return this.prisma.crop.create({
      data: createCropDto,
    });
  }

  findAll(userId: string) {
    return this.prisma.crop.findMany({
      where: {
        zameen: {
          profile: {
            userId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByZameen(userId: string, zameenId: string) {
    const zameen = await this.prisma.zameen.findFirst({
      where: {
        id: zameenId,
        profile: {
          userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!zameen) {
      throw new NotFoundException('Zameen not found.');
    }

    return this.prisma.crop.findMany({
      where: {
        zameenId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(userId: string, id: string, updateCropDto: UpdateCropDto) {
    const crop = await this.prisma.crop.findFirst({
      where: {
        id,
        zameen: {
          profile: {
            userId,
          },
        },
      },
    });

    if (!crop) {
      throw new NotFoundException('Crop not found.');
    }

    const nextZameenId = updateCropDto.zameenId ?? crop.zameenId;
    const nextCropAreaSqft = updateCropDto.cropAreaSqft ?? crop.cropAreaSqft;

    await this.assertCropAreaFits(userId, nextZameenId, nextCropAreaSqft, id);

    return this.prisma.crop.update({
      where: {
        id,
      },
      data: updateCropDto,
    });
  }

  async remove(userId: string, id: string) {
    const crop = await this.prisma.crop.findFirst({
      where: {
        id,
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

  private async assertCropAreaFits(
    userId: string,
    zameenId: string,
    cropAreaSqft: number,
    excludeCropId?: string,
  ) {
    const zameen = await this.prisma.zameen.findFirst({
      where: {
        id: zameenId,
        profile: {
          userId,
        },
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
        zameenId,
        ...(excludeCropId ? { NOT: { id: excludeCropId } } : {}),
      },
      select: {
        cropAreaSqft: true,
      },
    });

    const usedAreaSqft = existingCrops.reduce(
      (total, crop) => total + crop.cropAreaSqft,
      0,
    );

    if (usedAreaSqft + cropAreaSqft > zameen.totalAreaSqft) {
      throw new BadRequestException(
        'Crop area cannot exceed available zameen area.',
      );
    }
  }
}
