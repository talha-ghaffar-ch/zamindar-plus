import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZameenDto } from './dto/create-zameen.dto';
import { UpdateZameenDto } from './dto/update-zameen.dto';

@Injectable()
export class ZameenService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createZameenDto: CreateZameenDto) {
    const profile = await this.prisma.profile.findFirst({
      where: {
        id: createZameenDto.profileId,
        userId,
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

  findAll(userId: string) {
    return this.prisma.zameen.findMany({
      where: {
        profile: {
          userId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByProfile(userId: string, profileId: string) {
    const profile = await this.prisma.profile.findFirst({
      where: {
        id: profileId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    return this.prisma.zameen.findMany({
      where: {
        profileId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(userId: string, id: string, updateZameenDto: UpdateZameenDto) {
    const zameen = await this.prisma.zameen.findFirst({
      where: {
        id,
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

    if (updateZameenDto.profileId) {
      const profile = await this.prisma.profile.findFirst({
        where: {
          id: updateZameenDto.profileId,
          userId,
        },
        select: {
          id: true,
        },
      });

      if (!profile) {
        throw new NotFoundException('Profile not found.');
      }
    }

    return this.prisma.zameen.update({
      where: {
        id,
      },
      data: updateZameenDto,
    });
  }

  async remove(userId: string, id: string) {
    const zameen = await this.prisma.zameen.findFirst({
      where: {
        id,
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
