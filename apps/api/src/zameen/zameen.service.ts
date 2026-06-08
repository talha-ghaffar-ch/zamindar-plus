import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZameenDto } from './dto/create-zameen.dto';

@Injectable()
export class ZameenService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createZameenDto: CreateZameenDto) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        id: createZameenDto.profileId,
      },
      select: {
        id: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    return this.prisma.zameen.create({
      data: createZameenDto,
    });
  }

  findAll() {
    return this.prisma.zameen.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findByProfile(profileId: string) {
    return this.prisma.zameen.findMany({
      where: {
        profileId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async remove(id: string) {
    const zameen = await this.prisma.zameen.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!zameen) {
      throw new NotFoundException('Zameen not found.');
    }

    await this.prisma.zameen.delete({
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
