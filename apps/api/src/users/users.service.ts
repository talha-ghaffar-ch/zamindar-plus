import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const safeUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  farmerType: true,
  role: true,
  profileImageUrl: true,
  preferredAreaUnit: true,
  preferredCurrency: true,
  preferredLanguage: true,
  dateFormat: true,
  emailNotifications: true,
  smsNotifications: true,
  weeklyReport: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(currentUserId: string, createUserDto: CreateUserDto) {
    await this.ensureAdmin(currentUserId);

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: createUserDto.email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 12);

    return this.prisma.user.create({
      data: {
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        phone: createUserDto.phone,
        farmerType: createUserDto.farmerType,
        passwordHash,
      },
      select: safeUserSelect,
    });
  }

  async findAll(userId: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        role: true,
      },
    });

    return this.prisma.user.findMany({
      where: currentUser?.role === 'ADMIN' ? undefined : { id: userId },
      select: safeUserSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(
    currentUserId: string,
    id: string,
    updateUserDto: UpdateUserDto,
  ) {
    if (currentUserId !== id) {
      throw new ForbiddenException('You can only update your own user record.');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (updateUserDto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: {
          email: updateUserDto.email,
        },
        select: {
          id: true,
        },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('A user with this email already exists.');
      }
    }

    const passwordHash = updateUserDto.password
      ? await bcrypt.hash(updateUserDto.password, 12)
      : undefined;

    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
        email: updateUserDto.email,
        phone: updateUserDto.phone,
        farmerType: updateUserDto.farmerType,
        profileImageUrl: updateUserDto.profileImageUrl,
        preferredAreaUnit: updateUserDto.preferredAreaUnit,
        preferredCurrency: updateUserDto.preferredCurrency,
        preferredLanguage: updateUserDto.preferredLanguage,
        dateFormat: updateUserDto.dateFormat,
        emailNotifications: updateUserDto.emailNotifications,
        smsNotifications: updateUserDto.smsNotifications,
        weeklyReport: updateUserDto.weeklyReport,
        passwordHash,
      },
      select: safeUserSelect,
    });
  }

  async remove(currentUserId: string, id: string) {
    if (currentUserId !== id) {
      throw new ForbiddenException('You can only delete your own user record.');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    await this.prisma.user.delete({
      where: {
        id,
      },
    });

    return {
      deleted: true,
      id,
    };
  }

  private async ensureAdmin(userId: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        role: true,
      },
    });

    if (currentUser?.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create user accounts.');
    }
  }
}
