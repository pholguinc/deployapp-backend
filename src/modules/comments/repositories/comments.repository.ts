import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, Comment } from '@prisma/client';

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CommentCreateInput): Promise<Comment> {
    return await this.prisma.comment.create({ data });
  }

  async findAllByLesson(lessonId: string): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async findById(id: string): Promise<Comment | null> {
    return this.prisma.comment.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, data: Prisma.CommentUpdateInput): Promise<Comment> {
    return this.prisma.comment.update({ where: { id }, data });
  }

  async remove(id: string): Promise<Comment> {
    return this.prisma.comment.delete({ where: { id } });
  }
}
