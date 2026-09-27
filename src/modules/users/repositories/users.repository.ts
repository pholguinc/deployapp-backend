import { Injectable } from '@nestjs/common';
import { User, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type UserWithRole = User & {
  role: Role | null;
};

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<UserWithRole> {
    return this.prisma.user.create({
      data,
      include: { role: true },
    });
  }

  async findAll(
    skip?: number,
    take?: number,
  ): Promise<[UserWithRole[], number]> {
    return Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        include: { role: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
  }

  async findById(id: string): Promise<UserWithRole | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  async update(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<UserWithRole> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });
  }
}
