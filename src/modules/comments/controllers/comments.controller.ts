import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommentsService } from '../services/comments.service';
import { CreateCommentDto } from '../dtos/create-comment.dto';
import { UpdateCommentDto } from '../dtos/update-comment.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { RequestUser } from 'src/common';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new comment' })
  create(
    @Request() req: RequestUser,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(req.user.id, createCommentDto);
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'List all comments for a lesson' })
  findAllByLesson(@Param('lessonId') lessonId: string) {
    return this.commentsService.findAllByLesson(lessonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comment by ID' })
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a comment (own comment or likes)' })
  update(
    @Request() req: RequestUser,
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, req.user.id, updateCommentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment (own comment or admin)' })
  remove(@Request() req: RequestUser, @Param('id') id: string) {
    const role = req.user.role || 'USER';
    return this.commentsService.remove(id, req.user.id, role);
  }
}
