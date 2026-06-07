import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

const safeUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  farmerType: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
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

  findAll() {
    return this.prisma.user.findMany({
      select: safeUserSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
