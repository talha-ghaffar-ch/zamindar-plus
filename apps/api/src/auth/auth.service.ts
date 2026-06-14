import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailService } from './email.service';

const safeUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  farmerType: true,
  role: true,
  emailVerified: true,
  emailVerifiedAt: true,
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

type SafeUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  farmerType: string | null;
  role: string;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  profileImageUrl: string | null;
  preferredAreaUnit: string;
  preferredCurrency: string;
  preferredLanguage: string;
  dateFormat: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  weeklyReport: boolean;
  googleConnected: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type UserWithGoogle = Omit<SafeUser, 'googleConnected'> & {
  googleId: string | null;
};

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async signup(signupDto: SignupDto) {
    const email = signupDto.email.toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(signupDto.password, 12);
    const verification = this.createVerificationToken();
    const user = await this.prisma.user.create({
      data: {
        firstName: signupDto.firstName,
        lastName: signupDto.lastName,
        email,
        phone: signupDto.phone,
        farmerType: signupDto.farmerType,
        passwordHash,
        emailVerified: false,
        emailVerifiedAt: null,
        emailVerificationTokenHash: verification.tokenHash,
        emailVerificationExpiresAt: verification.expiresAt,
      },
      select: safeUserSelect,
    });

    try {
      await this.emailService.sendVerificationEmail({
        email: user.email,
        firstName: user.firstName,
        token: verification.token,
      });
    } catch (error) {
      await this.prisma.user.delete({
        where: {
          id: user.id,
        },
      });
      throw error;
    }

    return this.buildVerificationResponse(verification.token);
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: {
        email,
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

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before signing in.',
      );
    }

    return this.buildAuthResponse({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      farmerType: user.farmerType,
      role: user.role,
      emailVerified: user.emailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      profileImageUrl: user.profileImageUrl,
      preferredAreaUnit: user.preferredAreaUnit,
      preferredCurrency: user.preferredCurrency,
      preferredLanguage: user.preferredLanguage,
      dateFormat: user.dateFormat,
      emailNotifications: user.emailNotifications,
      smsNotifications: user.smsNotifications,
      weeklyReport: user.weeklyReport,
      googleConnected: Boolean(user.googleId),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const tokenHash = this.hashVerificationToken(verifyEmailDto.token);
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Verification code is invalid or expired.');
    }

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      },
    });

    return {
      message: 'Email verified successfully. You can now sign in.',
    };
  }

  async resendVerification(resendVerificationDto: ResendVerificationDto) {
    const email = resendVerificationDto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        emailVerified: true,
      },
    });

    if (!user || user.emailVerified) {
      return this.buildVerificationResentResponse();
    }

    const verification = this.createVerificationToken();
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerificationTokenHash: verification.tokenHash,
        emailVerificationExpiresAt: verification.expiresAt,
      },
    });

    await this.emailService.sendVerificationEmail({
      email: user.email,
      firstName: user.firstName,
      token: verification.token,
    });

    return this.buildVerificationResentResponse(verification.token);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const email = forgotPasswordDto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
      },
    });

    if (!user) {
      return this.buildPasswordResetSentResponse();
    }

    const reset = this.createPasswordResetToken();
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordResetTokenHash: reset.tokenHash,
        passwordResetExpiresAt: reset.expiresAt,
      },
    });

    try {
      await this.emailService.sendPasswordResetEmail({
        email: user.email,
        firstName: user.firstName,
        token: reset.token,
      });
    } catch (error) {
      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
        },
      });
      throw error;
    }

    return this.buildPasswordResetSentResponse(reset.token);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const tokenHash = this.hashVerificationToken(resetPasswordDto.token);
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Password reset code is invalid or expired.',
      );
    }

    const passwordHash = await bcrypt.hash(resetPasswordDto.password, 12);
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    return {
      message: 'Password reset successfully. You can now sign in.',
    };
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
              emailVerified: true,
              emailVerifiedAt: new Date(),
              emailVerificationTokenHash: null,
              emailVerificationExpiresAt: null,
              profileImageUrl:
                existingUser.profileImageUrl ?? googleProfile.picture,
            },
            select: {
              ...safeUserSelect,
              googleId: true,
            },
          });

      return this.buildAuthResponse(this.withGoogleConnected(user));
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
        emailVerified: true,
        emailVerifiedAt: new Date(),
        profileImageUrl: googleProfile.picture,
        farmerType: 'Land Owner',
      },
      select: {
        ...safeUserSelect,
        googleId: true,
      },
    });

    return this.buildAuthResponse(this.withGoogleConnected(user));
  }

  async connectGoogleAccount(userId: string, googleLoginDto: GoogleLoginDto) {
    const googleProfile = await this.verifyGoogleCredential(
      googleLoginDto.credential,
    );
    const email = googleProfile.email?.toLowerCase();

    if (!email || !googleProfile.sub) {
      throw new UnauthorizedException('Google account details are incomplete.');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        ...safeUserSelect,
        googleId: true,
      },
    });

    if (!currentUser) {
      throw new UnauthorizedException('Authenticated user was not found.');
    }

    if (currentUser.email.toLowerCase() !== email) {
      throw new ConflictException(
        'Google email must match your account email.',
      );
    }

    if (currentUser.googleId && currentUser.googleId !== googleProfile.sub) {
      throw new ConflictException(
        'This account is already connected to another Google account.',
      );
    }

    const googleOwner = await this.prisma.user.findFirst({
      where: {
        googleId: googleProfile.sub,
      },
      select: {
        id: true,
      },
    });

    if (googleOwner && googleOwner.id !== currentUser.id) {
      throw new ConflictException(
        'This Google account is already connected to another user.',
      );
    }

    const user = await this.prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        googleId: googleProfile.sub,
        authProvider: 'GOOGLE',
        emailVerified: true,
        emailVerifiedAt: currentUser.emailVerifiedAt ?? new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
        profileImageUrl: currentUser.profileImageUrl ?? googleProfile.picture,
      },
      select: {
        ...safeUserSelect,
        googleId: true,
      },
    });

    return this.withGoogleConnected(user);
  }

  async disconnectGoogleAccount(userId: string) {
    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        googleId: null,
        authProvider: 'PASSWORD',
      },
      select: {
        ...safeUserSelect,
        googleId: true,
      },
    });

    return this.withGoogleConnected(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        ...safeUserSelect,
        googleId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Authenticated user was not found.');
    }

    return this.withGoogleConnected(user);
  }

  private async buildAuthResponse(user: SafeUser) {
    const accessToken = await this.jwtService.signAsync({
      userId: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user,
    };
  }

  private withGoogleConnected(user: UserWithGoogle): SafeUser {
    const { googleId: _googleId, ...safeUser } = user;

    return {
      ...safeUser,
      googleConnected: Boolean(_googleId),
    };
  }

  private buildVerificationResponse(token?: string) {
    return {
      message: 'Account created successfully. Please verify your email code.',
      verificationRequired: true,
      ...this.developmentVerificationToken(token),
    };
  }

  private buildVerificationResentResponse(token?: string) {
    return {
      message:
        'If that email is awaiting verification, a new verification code has been prepared.',
      ...this.developmentVerificationToken(token),
    };
  }

  private buildPasswordResetSentResponse(token?: string) {
    return {
      message:
        'If that email is registered, a password reset code has been sent.',
      ...this.developmentVerificationToken(token),
    };
  }

  private developmentVerificationToken(token?: string) {
    if (process.env.NODE_ENV === 'production' || !token) {
      return {};
    }

    return {
      devVerificationToken: token,
    };
  }

  private createVerificationToken() {
    const token = String(randomInt(100000, 1000000));

    return {
      token,
      tokenHash: this.hashVerificationToken(token),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  private createPasswordResetToken() {
    const token = String(randomInt(100000, 1000000));

    return {
      token,
      tokenHash: this.hashVerificationToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    };
  }

  private hashVerificationToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
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
