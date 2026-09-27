import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Achievement } from '@prisma/client';
import { CreateAchievementRequestDto } from '../dtos/requests/create-achievement.request.dto';
import { UpdateAchievementRequestDto } from '../dtos/requests/update-achievement.request.dto';

@Injectable()
export class AchievementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAchievementRequestDto): Promise<Achievement> {
    return await this.prisma.achievement.create({ data });
  }

  async findAll(
    skip?: number,
    take?: number,
  ): Promise<[Achievement[], number]> {
    return Promise.all([
      this.prisma.achievement.findMany({
        skip,
        take,
        where: { estado: true },
        orderBy: { orden: 'asc' },
      }),
      this.prisma.achievement.count({ where: { estado: true } }),
    ]);
  }

  async findById(id: string): Promise<Achievement | null> {
    return this.prisma.achievement.findUnique({ where: { id } });
  }

  async update(
    id: string,
    data: UpdateAchievementRequestDto,
  ): Promise<Achievement> {
    return this.prisma.achievement.update({ where: { id }, data });
  }

  async remove(id: string): Promise<Achievement> {
    return this.prisma.achievement.delete({ where: { id } });
  }
}
