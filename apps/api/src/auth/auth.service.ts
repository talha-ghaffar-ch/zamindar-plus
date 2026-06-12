import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

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
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async signup(signupDto: SignupDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: signupDto.email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(signupDto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        firstName: signupDto.firstName,
        lastName: signupDto.lastName,
        email: signupDto.email,
        phone: signupDto.phone,
        farmerType: signupDto.farmerType,
        passwordHash,
      },
      select: safeUserSelect,
    });

    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginDto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.buildAuthResponse({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      farmerType: user.farmerType,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      preferredAreaUnit: user.preferredAreaUnit,
      preferredCurrency: user.preferredCurrency,
      preferredLanguage: user.preferredLanguage,
      dateFormat: user.dateFormat,
      emailNotifications: user.emailNotifications,
      smsNotifications: user.smsNotifications,
      weeklyReport: user.weeklyReport,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: safeUserSelect,
    });

    if (!user) {
      throw new UnauthorizedException('Authenticated user was not found.');
    }

    return user;
  }

  private async buildAuthResponse(user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    farmerType: string | null;
    role: string;
    profileImageUrl: string | null;
    preferredAreaUnit: string;
    preferredCurrency: string;
    preferredLanguage: string;
    dateFormat: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    weeklyReport: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const accessToken = await this.jwtService.signAsync({
      userId: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user,
    };
  }
}
