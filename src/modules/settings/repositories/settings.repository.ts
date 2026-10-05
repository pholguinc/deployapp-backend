import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByKey(key: string) {
    return await this.prisma.setting.findUnique({
      where: { key },
    });
  }

  async findAll() {
    return this.prisma.setting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async upsert(key: string, value: any, description?: string) {
    return this.prisma.setting.upsert({
      where: { key },
      create: {
        key,
        value,
        description,
      },
      update: {
        value,
        ...(description !== undefined ? { description } : {}),
      },
    });
  }
}
