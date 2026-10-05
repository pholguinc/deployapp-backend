import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { LessonsService } from '../services/lessons.service';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { CreateLessonDto } from '../dtos/create-lesson.dto';
import { UpdateLessonDto } from '../dtos/update-lesson.dto';
import { CreateQuizDto, CreateQuestionDto } from '../dtos/create-quiz.dto';
import {
  UpdateQuizDto,
  UpdateQuestionDto,
  UpdateOptionDto,
} from '../dtos/update-quiz.dto';
import type { RequestUser } from 'src/common/interfaces/request-user.interface';

@ApiTags('Lessons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Create a new lesson in a module' })
  create(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonsService.create(createLessonDto);
  }

  @Get('module/:moduleId')
  @ApiOperation({ summary: 'List all lessons for a specific module' })
  findAllByModule(@Param('moduleId') moduleId: string) {
    return this.lessonsService.findAllByModule(moduleId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get lesson by ID including resources and comments',
  })
  findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Update lesson by ID' })
  update(@Param('id') id: string, @Body() updateLessonDto: UpdateLessonDto) {
    return this.lessonsService.update(id, updateLessonDto);
  }

  @Delete(':id')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Delete lesson by ID' })
  remove(@Param('id') id: string) {
    return this.lessonsService.remove(id);
  }

  // --- LESSON COMPLETION ---
  @Post(':id/toggle-complete')
  @ApiOperation({
    summary: 'Toggle completion status of a lesson for the current user',
  })
  toggleComplete(@Request() req: RequestUser, @Param('id') id: string) {
    const userId = req.user.id;
    return this.lessonsService.toggleLessonComplete(userId, id);
  }

  // --- VIDEO ---
  @Post(':lessonId/video')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @UseInterceptors(FileInterceptor('video'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a video for a lesson (S3)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['video'],
      properties: {
        video: {
          type: 'string',
          format: 'binary',
          description: 'Video file (MP4, WEBM, etc.)',
        },
      },
    },
  })
  uploadVideo(
    @Param('lessonId') lessonId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.lessonsService.uploadVideo(lessonId, file);
  }

  // --- RESOURCES ---
  @Post(':lessonId/resources')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a resource file to a lesson (S3)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Resource file (PDF, DOC, image, video, etc.)',
        },
        name: {
          type: 'string',
          description: 'Optional display name for the resource',
        },
        type: {
          type: 'string',
          description:
            'Optional resource type (PDF, DOC, IMAGE, VIDEO, etc.). Auto-detected if omitted.',
        },
      },
    },
  })
  addResource(
    @Param('lessonId') lessonId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name?: string,
    @Body('type') type?: string,
  ) {
    return this.lessonsService.addResource(lessonId, file, name, type);
  }

  @Get(':lessonId/resources')
  @ApiOperation({ summary: 'List all resources for a lesson' })
  getResources(@Param('lessonId') lessonId: string) {
    return this.lessonsService.getResourcesByLesson(lessonId);
  }

  @Delete('resources/:resourceId')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Delete a resource by ID' })
  removeResource(@Param('resourceId') resourceId: string) {
    return this.lessonsService.removeResource(resourceId);
  }

  // --- QUIZZES ---
  @Post(':lessonId/quizzes')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({
    summary: 'Create a quiz for a lesson (with questions and options)',
  })
  createQuiz(
    @Param('lessonId') lessonId: string,
    @Body() createQuizDto: CreateQuizDto,
  ) {
    createQuizDto.lessonId = lessonId;
    return this.lessonsService.createQuiz(createQuizDto);
  }

  @Get(':lessonId/quizzes')
  @ApiOperation({ summary: 'List all quizzes for a lesson' })
  getQuizzes(@Param('lessonId') lessonId: string) {
    return this.lessonsService.getQuizzesByLesson(lessonId);
  }

  @Get('quizzes/:quizId')
  @ApiOperation({ summary: 'Get a quiz by ID with questions and options' })
  getQuiz(@Param('quizId') quizId: string) {
    return this.lessonsService.getQuizById(quizId);
  }

  @Patch('quizzes/:quizId')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Update a quiz title' })
  updateQuiz(
    @Param('quizId') quizId: string,
    @Body() updateQuizDto: UpdateQuizDto,
  ) {
    return this.lessonsService.updateQuiz(quizId, updateQuizDto);
  }

  @Delete('quizzes/:quizId')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Delete a quiz by ID' })
  removeQuiz(@Param('quizId') quizId: string) {
    return this.lessonsService.removeQuiz(quizId);
  }

  // --- QUESTIONS ---
  @Post('quizzes/:quizId/questions')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Add a question with options to a quiz' })
  addQuestion(
    @Param('quizId') quizId: string,
    @Body() createQuestionDto: CreateQuestionDto,
  ) {
    return this.lessonsService.addQuestion(quizId, createQuestionDto);
  }

  @Patch('quizzes/questions/:questionId')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Update a question text' })
  updateQuestion(
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.lessonsService.updateQuestion(questionId, updateQuestionDto);
  }

  @Delete('quizzes/questions/:questionId')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Delete a question by ID' })
  removeQuestion(@Param('questionId') questionId: string) {
    return this.lessonsService.removeQuestion(questionId);
  }

  // --- OPTIONS ---
  @Patch('quizzes/options/:optionId')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Update an option' })
  updateOption(
    @Param('optionId') optionId: string,
    @Body() body: UpdateOptionDto,
  ) {
    return this.lessonsService.updateOption(optionId, body);
  }

  @Delete('quizzes/options/:optionId')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Delete an option by ID' })
  removeOption(@Param('optionId') optionId: string) {
    return this.lessonsService.removeOption(optionId);
  }
}
