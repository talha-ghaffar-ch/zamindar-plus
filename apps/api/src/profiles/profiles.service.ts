import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProfileDto: CreateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: createProfileDto.userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.prisma.profile.create({
      data: createProfileDto,
    });
  }

  findAll() {
    return this.prisma.profile.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findByUser(userId: string) {
    return this.prisma.profile.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
