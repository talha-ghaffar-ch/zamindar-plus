import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleLoginDto } from './dto/google-login.dto';
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
  private readonly googleClient = new OAuth2Client();

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

  async googleLogin(googleLoginDto: GoogleLoginDto) {
    const googleProfile = await this.verifyGoogleCredential(
      googleLoginDto.credential,
    );
    const email = googleProfile.email?.toLowerCase();

    if (!email || !googleProfile.sub) {
      throw new UnauthorizedException('Google account details are incomplete.');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          {
            googleId: googleProfile.sub,
          },
          {
            email,
          },
        ],
      },
      select: {
        ...safeUserSelect,
        googleId: true,
      },
    });

    if (existingUser) {
      if (
        existingUser.googleId &&
        existingUser.googleId !== googleProfile.sub
      ) {
        throw new ConflictException(
          'This email is already linked to another Google account.',
        );
      }

      const user = existingUser.googleId
        ? existingUser
        : await this.prisma.user.update({
            where: {
              id: existingUser.id,
            },
            data: {
              googleId: googleProfile.sub,
              authProvider: 'GOOGLE',
              profileImageUrl:
                existingUser.profileImageUrl ?? googleProfile.picture,
            },
            select: {
              ...safeUserSelect,
              googleId: true,
            },
          });

      return this.buildAuthResponse(user);
    }

    const nameParts = this.getGoogleNameParts(googleProfile);
    const passwordHash = await bcrypt.hash(
      `google:${googleProfile.sub}:${randomUUID()}`,
      12,
    );
    const user = await this.prisma.user.create({
      data: {
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        email,
        passwordHash,
        googleId: googleProfile.sub,
        authProvider: 'GOOGLE',
        profileImageUrl: googleProfile.picture,
        farmerType: 'Land Owner',
      },
      select: safeUserSelect,
    });

    return this.buildAuthResponse(user);
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

  private async verifyGoogleCredential(credential: string) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      throw new UnauthorizedException('Google sign-in is not configured.');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();

    if (!payload?.email_verified) {
      throw new UnauthorizedException('Google email must be verified.');
    }

    return payload;
  }

  private getGoogleNameParts(profile: TokenPayload) {
    const fallbackName = profile.name?.trim() || 'Google User';
    const fallbackParts = fallbackName.split(/\s+/);

    return {
      firstName: profile.given_name?.trim() || fallbackParts[0] || 'Google',
      lastName:
        profile.family_name?.trim() ||
        fallbackParts.slice(1).join(' ') ||
        'User',
    };
  }
}
