import { Injectable } from '@nestjs/common';
import { User, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type UserWithRole = Omit<User, 'password' | 'roleId'> & {
  role: Role | null;
  password?: string;
  roleId?: string | null;
};

const userOmit = {
  password: true,
  roleId: true,
} as const;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<UserWithRole> {
    return this.prisma.user.create({
      data,
      omit: userOmit,
      include: { role: true },
    });
  }

  async findAll(
    skip?: number,
    take?: number,
    roleName?: string,
  ): Promise<[UserWithRole[], number]> {
    const where: Prisma.UserWhereInput = roleName
      ? { role: { name: roleName } }
      : {};

    return Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        omit: userOmit,
        include: { role: true },
        orderBy: { createdAt: 'desc' },
      }) as unknown as Promise<UserWithRole[]>,
      this.prisma.user.count({ where }),
    ]);
  }

  async findById(id: string): Promise<UserWithRole | null> {
    return this.prisma.user.findUnique({
      where: { id },
      omit: userOmit,
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
      omit: userOmit,
      include: { role: true },
    });
  }
}
