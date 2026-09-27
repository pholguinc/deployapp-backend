import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CommentsRepository } from '../repositories/comments.repository';
import { CreateCommentDto } from '../dtos/create-comment.dto';
import { UpdateCommentDto } from '../dtos/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async create(userId: string, createCommentDto: CreateCommentDto) {
    const { lessonId, text } = createCommentDto;
    return await this.commentsRepository.create({
      text,
      lesson: { connect: { id: lessonId } },
      user: { connect: { id: userId } },
    });
  }

  async findAllByLesson(lessonId: string) {
    return await this.commentsRepository.findAllByLesson(lessonId);
  }

  async findOne(id: string) {
    const comment = await this.commentsRepository.findById(id);
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    return comment;
  }

  async update(id: string, userId: string, updateCommentDto: UpdateCommentDto) {
    const comment = await this.findOne(id);
    // Allow updating likes without owning the comment, but text requires ownership
    if (updateCommentDto.text && comment.userId !== userId) {
      // In a real app, you might check if user is admin too
      throw new ForbiddenException('You can only edit your own comments');
    }
    return await this.commentsRepository.update(id, updateCommentDto);
  }

  async remove(id: string, userId: string, userRole: string) {
    const comment = await this.findOne(id);
    const isAdmin =
      userRole === 'ADMIN' || userRole === 'SUPERADMIN';
    if (comment.userId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    return await this.commentsRepository.remove(id);
  }
}
