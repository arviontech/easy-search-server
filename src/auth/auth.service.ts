import {
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import configuration from '../config/configuration';
import { TLogin, TRegistration } from './authDto/authSchema';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }


  // Check if user exists by email or contact number
  private async findUserByCredentials(email?: string, contactNumber?: string) {
    if (!email && !contactNumber) return null;

    const condition = [
      email ? { email } : null,
      contactNumber ? { contactNumber } : null,
    ].filter((c) => c !== null) as Array<{ email: string } | { contactNumber: string }>;

    return this.prisma.user.findFirst({
      where: {
        OR: condition,
      },
      select: {
        id: true,
        role: true,
        password: true,
        email: true,
      },
    });
  }

  // Save or update refresh token in database
  private async saveRefreshToken(userId: string, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, 12);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Use upsert to avoid race conditions
    await this.prisma.refreshToken.upsert({
      where: { userId },
      update: {
        tokenHash: hashedToken,
        expiresAt,
        userAgent: 'unknown',
        ip: 'unknown',
      },
      create: {
        userId,
        tokenHash: hashedToken,
        expiresAt,
        userAgent: 'unknown',
        ip: 'unknown',
      },
    });
  }

  // Generate access and refresh tokens
  private async generateTokens(userId: string, role: string) {
    const payload = { userId, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: configuration().JWT.JWT_ACCESS_SECRET,
        expiresIn: configuration().JWT.JWT_ACCESS_EXPIRES_IN,
      } as JwtSignOptions),
      this.jwtService.signAsync(payload, {
        secret: configuration().JWT.JWT_REFRESH_SECRET,
        expiresIn: configuration().JWT.JWT_REFRESH_EXPIRES_IN,
      } as JwtSignOptions),
    ]);

    await this.saveRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken };
  }

  // Validate password strength
  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
  }


  // Handle Google signup
  private async handleGoogleSignup(payload: TLogin) {
    if (!payload.email || !payload.contactNumber) {
      throw new BadRequestException(
        'Email and contact number are required for Google sign-up',
      );
    }

    // Store validated values to fix TypeScript type narrowing in transaction
    const email = payload.email;
    const contactNumber = payload.contactNumber;

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          contactNumber,
          role: UserRole.CUSTOMER,
        },
      });

      await tx.customer.create({
        data: {
          userId: newUser.id,
          email,
          contactNumber,
          ...(payload.name && { name: payload.name }),
          ...(payload.profilePhoto && { profilePhoto: payload.profilePhoto }),
        },
      });

      return newUser;
    });

    return this.generateTokens(user.id, user.role);
  }

  // Registration
  async registration(payload: TRegistration) {
    if (!payload.email) {
      throw new BadRequestException('Email is required');
    }
    if (!payload.contactNumber) {
      throw new BadRequestException('Contact number is required');
    }
    if (!payload.password) {
      throw new BadRequestException('Password is required');
    }

    this.validatePassword(payload.password);

    const existingUser = await this.findUserByCredentials(
      payload.email,
      payload.contactNumber,
    );

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    const hashedPassword = await bcrypt.hash(payload.password, 12);
    const userRole = payload.role === 'HOST' ? UserRole.HOST : UserRole.CUSTOMER;

    // Create user and profile in transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: payload.email,
          contactNumber: payload.contactNumber,
          password: hashedPassword,
          role: userRole,
        },
      });

      const profileData = {
        userId: newUser.id,
        name: payload.name,
        email: payload.email,
        contactNumber: payload.contactNumber,
      };

      if (userRole === UserRole.HOST) {
        await tx.host.create({ data: profileData });
      } else {
        await tx.customer.create({ data: profileData });
      }

      return newUser;
    });

    return this.generateTokens(user.id, user.role);
  }

  // Login both google and credentials
  async login(payload: TLogin) {
    const existingUser = await this.findUserByCredentials(
      payload.email,
      payload.contactNumber,
    );

    // Google OAuth login
    if (payload.provider === 'google') {
      if (!existingUser) {
        return this.handleGoogleSignup(payload);
      }
      return this.generateTokens(existingUser.id, existingUser.role);
    }

    // Credentials login
    if (!existingUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!payload.password || !existingUser.password) {
      throw new BadRequestException('Password is required');
    }

    const isPasswordValid = await bcrypt.compare(
      payload.password,
      existingUser.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(existingUser.id, existingUser.role);
  }



  // Refresh token
  async refreshToken(oldRefreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(oldRefreshToken, {
        secret: configuration().JWT.JWT_REFRESH_SECRET,
      });

      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { userId: payload.userId },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isValid = await bcrypt.compare(oldRefreshToken, storedToken.tokenHash);

      if (!isValid || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      return this.generateTokens(payload.userId, payload.role);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // Logout
  async logout(userId: string) {
    await this.prisma.refreshToken.delete({
      where: { userId },
    });
    return { message: 'Logged out successfully' };
  }
}