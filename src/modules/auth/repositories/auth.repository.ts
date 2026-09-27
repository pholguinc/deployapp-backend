import { Injectable } from '@nestjs/common';
import { Prisma, Role, Session, User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type UserWithRole = User & {
  role: Role | null;
};

export type SessionWithUser = Session & {
  user: UserWithRole;
};

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string): Promise<UserWithRole | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });
  }

  async findUserById(id: string): Promise<UserWithRole | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });
  }

  async createSession(data: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<Session> {
    return this.prisma.session.create({
      data: {
        userId: data.userId,
        refreshTokenHash: data.refreshTokenHash,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
      },
    });
  }

  async findSessionByTokenHash(
    refreshTokenHash: string,
  ): Promise<SessionWithUser | null> {
    return this.prisma.session.findFirst({
      where: {
        refreshTokenHash,
        isRevoked: false,
      },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async revokeSession(id: string): Promise<Session> {
    return this.prisma.session.update({
      where: { id },
      data: { isRevoked: true },
    });
  }

  async revokeSessionByTokenHash(
    refreshTokenHash: string,
  ): Promise<Prisma.BatchPayload> {
    return await this.prisma.session.updateMany({
      where: { refreshTokenHash },
      data: { isRevoked: true },
    });
  }

  async revokeAllUserSessions(userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }
}
