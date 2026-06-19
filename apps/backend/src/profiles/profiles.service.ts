import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, createProfileDto: CreateProfileDto) {
    return this.prisma.profile.create({
      data: {
        ...createProfileDto,
        userId,
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.profile.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findByUser(currentUserId: string, userId: string) {
    if (currentUserId !== userId) {
      throw new ForbiddenException('You can only view your own profiles.');
    }

    return this.findAll(userId);
  }

  async update(userId: string, id: string, updateProfileDto: UpdateProfileDto) {
    const profile = await this.prisma.profile.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    return this.prisma.profile.update({
      where: {
        id,
      },
      data: {
        profileName: updateProfileDto.profileName,
        city: updateProfileDto.city,
        chakAreaName: updateProfileDto.chakAreaName,
        villageName: updateProfileDto.villageName,
      },
    });
  }

  async remove(userId: string, id: string) {
    const profile = await this.prisma.profile.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    await this.prisma.profile.delete({
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
