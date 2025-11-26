import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { TUser } from './userDto/userSchema';
import { UserRole } from '@prisma/client';




@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) { }

  async createAdmin(payload: TUser) {
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    if (!payload.email) {
      throw new Error('Email is required for Admin creation');
    }

    const userData = {
      email: payload.email,
      contactNumber: payload.contactNumber,
      password: hashedPassword,
      role: UserRole.ADMIN,
    };

    const AdminData = {
      name: payload.name,
      email: payload.email,
      contactNumber: payload.contactNumber,
    };
    const user = await this.prisma.$transaction(async (transactionClient) => {
      const createdUser = await transactionClient.user.create({
        data: userData,
      });
      const admin = await transactionClient.admin.create({
        data: {
          ...AdminData,
          userId: createdUser.id,
        },
      });
      return admin;
    });

    return user;
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    return user;
  }
}
