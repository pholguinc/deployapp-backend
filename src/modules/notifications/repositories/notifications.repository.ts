import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { randomUUID } from 'crypto';

export interface NotificationEntity {
  id: string;
  userId: string | null;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class NotificationsRepository implements OnModuleInit {
  private readonly logger = new Logger(NotificationsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      // Garantizar que la tabla notifications exista en la base de datos
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "notifications" (
          "id" TEXT NOT NULL,
          "userId" TEXT,
          "type" TEXT NOT NULL DEFAULT 'COURSE_COMPLETED',
          "title" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "data" JSONB,
          "read" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
        );
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications"("read");
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt");
      `);

      this.logger.log('Tabla notifications verificada/creada exitosamente.');
    } catch (error) {
      this.logger.error('Error al inicializar la tabla notifications:', error);
    }
  }

  async create(data: {
    userId?: string | null;
    type?: string;
    title: string;
    message: string;
    data?: any;
    read?: boolean;
  }): Promise<NotificationEntity> {
    const id = randomUUID();
    const userId = data.userId || null;
    const type = data.type || 'COURSE_COMPLETED';
    const read = data.read || false;
    const jsonData = data.data ? JSON.stringify(data.data) : null;

    const rows = await this.prisma.$queryRawUnsafe<NotificationEntity[]>(
      `
      INSERT INTO "notifications" ("id", "userId", "type", "title", "message", "data", "read", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
      `,
      id,
      userId,
      type,
      data.title,
      data.message,
      jsonData,
      read,
    );

    return rows[0];
  }

  async findMany(params: {
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationEntity[]> {
    const limit = params.limit || 50;

    if (params.unreadOnly) {
      return this.prisma.$queryRawUnsafe<NotificationEntity[]>(
        `
        SELECT * FROM "notifications"
        WHERE "read" = false
        ORDER BY "createdAt" DESC
        LIMIT $1;
        `,
        limit,
      );
    }

    return this.prisma.$queryRawUnsafe<NotificationEntity[]>(
      `
      SELECT * FROM "notifications"
      ORDER BY "createdAt" DESC
      LIMIT $1;
      `,
      limit,
    );
  }

  async findById(id: string): Promise<NotificationEntity | null> {
    const rows = await this.prisma.$queryRawUnsafe<NotificationEntity[]>(
      `
      SELECT * FROM "notifications"
      WHERE "id" = $1
      LIMIT 1;
      `,
      id,
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async countUnread(): Promise<number> {
    const rows = await this.prisma.$queryRawUnsafe<{ count: string | number }[]>(
      `
      SELECT COUNT(*)::int as count FROM "notifications"
      WHERE "read" = false;
      `,
    );
    return Number(rows[0]?.count || 0);
  }

  async countTotal(): Promise<number> {
    const rows = await this.prisma.$queryRawUnsafe<{ count: string | number }[]>(
      `
      SELECT COUNT(*)::int as count FROM "notifications";
      `,
    );
    return Number(rows[0]?.count || 0);
  }

  async markAsRead(id: string): Promise<NotificationEntity | null> {
    const rows = await this.prisma.$queryRawUnsafe<NotificationEntity[]>(
      `
      UPDATE "notifications"
      SET "read" = true, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1
      RETURNING *;
      `,
      id,
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async markAllAsRead(): Promise<number> {
    const result = await this.prisma.$executeRawUnsafe(
      `
      UPDATE "notifications"
      SET "read" = true, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "read" = false;
      `,
    );
    return result;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.prisma.$executeRawUnsafe(
      `
      DELETE FROM "notifications"
      WHERE "id" = $1;
      `,
      id,
    );
    return result > 0;
  }
}
