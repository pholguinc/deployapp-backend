import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LessonsRepository } from '../repositories/lessons.repository';
import { CreateLessonDto } from '../dtos/create-lesson.dto';
import { UpdateLessonDto } from '../dtos/update-lesson.dto';
import { CreateQuizDto, CreateQuestionDto } from '../dtos/create-quiz.dto';
import { UpdateQuizDto, UpdateQuestionDto } from '../dtos/update-quiz.dto';
import { UploadService } from '../../upload/upload.service';
import 'multer';

@Injectable()
export class LessonsService {
  constructor(
    private readonly lessonsRepository: LessonsRepository,
    private readonly uploadService: UploadService,
  ) {}

  async create(createLessonDto: CreateLessonDto) {
    const { moduleId, ...rest } = createLessonDto;
    return await this.lessonsRepository.create({
      ...rest,
      module: { connect: { id: moduleId } },
    });
  }

  async findAllByModule(moduleId: string) {
    return await this.lessonsRepository.findAllByModule(moduleId);
  }

  async findOne(id: string) {
    const lesson = await this.lessonsRepository.findById(id);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }
    return lesson;
  }

  async update(id: string, updateLessonDto: UpdateLessonDto) {
    await this.findOne(id); // ensure exists
    const { moduleId, ...rest } = updateLessonDto;
    return await this.lessonsRepository.update(id, {
      ...rest,
      ...(moduleId && { module: { connect: { id: moduleId } } }),
    });
  }

  async remove(id: string) {
    const lesson = await this.findOne(id);

    // Delete video from S3 if it exists
    if (lesson.videoUrl) {
      await this.uploadService.deleteFile(lesson.videoUrl);
    }

    return await this.lessonsRepository.remove(id);
  }

  // --- VIDEO UPLOAD ---
  async uploadVideo(lessonId: string, file: Express.Multer.File) {
    const lesson = await this.lessonsRepository.findByIdWithCourseId(lessonId);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    // Delete old video if exists
    if (lesson.videoUrl) {
      await this.uploadService.deleteFile(lesson.videoUrl);
    }

    const courseId = lesson.module.courseId;
    const folder = `courses/${courseId}/lessons/${lessonId}`;

    const videoUrl = await this.uploadService.uploadFile(file, folder);

    return await this.lessonsRepository.update(lessonId, { videoUrl });
  }

  // --- RESOURCES ---
  async addResource(
    lessonId: string,
    file: Express.Multer.File,
    name?: string,
    type?: string,
  ) {
    await this.findOne(lessonId); // ensure lesson exists

    // Upload file to S3
    const url = await this.uploadService.uploadFile(file, 'resources');

    // Calculate human-readable file size
    const size = this.formatFileSize(file.size);

    // Determine resource type from file extension if not provided
    const resourceType = type || this.inferResourceType(file.originalname);

    return await this.lessonsRepository.createResource({
      name: name || file.originalname,
      type: resourceType,
      size,
      url,
      lesson: { connect: { id: lessonId } },
    });
  }

  async getResourcesByLesson(lessonId: string) {
    await this.findOne(lessonId);
    return await this.lessonsRepository.findResourcesByLesson(lessonId);
  }

  async removeResource(resourceId: string) {
    const resource = await this.lessonsRepository.findResourceById(resourceId);
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${resourceId} not found`);
    }
    if (resource.url) {
      await this.uploadService.deleteFile(resource.url);
    }
    return await this.lessonsRepository.removeResource(resourceId);
  }

  async updateResourceFile(resourceId: string, file: Express.Multer.File) {
    const resource = await this.lessonsRepository.findResourceById(resourceId);
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${resourceId} not found`);
    }

    // Delete old file from S3
    if (resource.url) {
      await this.uploadService.deleteFile(resource.url);
    }

    // Upload new file to S3
    const url = await this.uploadService.uploadFile(file, 'resources');
    const size = this.formatFileSize(Number(file.size));
    const resourceType = this.inferResourceType(file.originalname);

    // Update database
    return await this.lessonsRepository.updateResource(resourceId, {
      name: file.originalname,
      type: resourceType,
      size,
      url,
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private inferResourceType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const typeMap: Record<string, string> = {
      pdf: 'PDF',
      doc: 'DOC',
      docx: 'DOC',
      xls: 'XLS',
      xlsx: 'XLS',
      ppt: 'PPT',
      pptx: 'PPT',
      png: 'IMAGE',
      jpg: 'IMAGE',
      jpeg: 'IMAGE',
      gif: 'IMAGE',
      svg: 'IMAGE',
      mp4: 'VIDEO',
      webm: 'VIDEO',
      mov: 'VIDEO',
      mp3: 'AUDIO',
      wav: 'AUDIO',
      zip: 'ZIP',
      rar: 'ZIP',
    };
    return typeMap[ext] || 'FILE';
  }

  // --- QUIZZES ---
  async createQuiz(createQuizDto: CreateQuizDto) {
    const { lessonId, title, questions } = createQuizDto;
    await this.findOne(lessonId); // ensure lesson exists

    const data: Prisma.QuizCreateInput = {
      title,
      lesson: { connect: { id: lessonId } },
      ...(questions &&
        questions.length > 0 && {
          questions: {
            create: questions.map((q) => ({
              text: q.text,
              options: {
                create: q.options.map((o) => ({
                  text: o.text,
                  isCorrect: o.isCorrect ?? false,
                })),
              },
            })),
          },
        }),
    };

    return await this.lessonsRepository.createQuiz(data);
  }

  async getQuizzesByLesson(lessonId: string) {
    await this.findOne(lessonId);
    return await this.lessonsRepository.findQuizzesByLesson(lessonId);
  }

  async getQuizById(quizId: string) {
    const quiz = await this.lessonsRepository.findQuizById(quizId);
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }
    return quiz;
  }

  async updateQuiz(quizId: string, updateQuizDto: UpdateQuizDto) {
    await this.getQuizById(quizId);
    return await this.lessonsRepository.updateQuiz(quizId, updateQuizDto);
  }

  async removeQuiz(quizId: string) {
    await this.getQuizById(quizId);
    return await this.lessonsRepository.removeQuiz(quizId);
  }

  // --- QUESTIONS ---
  async addQuestion(quizId: string, createQuestionDto: CreateQuestionDto) {
    await this.getQuizById(quizId); // ensure quiz exists

    return await this.lessonsRepository.createQuestion({
      text: createQuestionDto.text,
      quiz: { connect: { id: quizId } },
      options: {
        create: createQuestionDto.options.map((o) => ({
          text: o.text,
          isCorrect: o.isCorrect ?? false,
        })),
      },
    });
  }

  async updateQuestion(
    questionId: string,
    updateQuestionDto: UpdateQuestionDto,
  ) {
    const question = await this.lessonsRepository.findQuestionById(questionId);
    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }
    return await this.lessonsRepository.updateQuestion(
      questionId,
      updateQuestionDto,
    );
  }

  async removeQuestion(questionId: string) {
    const question = await this.lessonsRepository.findQuestionById(questionId);
    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }
    return await this.lessonsRepository.removeQuestion(questionId);
  }

  // --- OPTIONS ---
  async updateOption(
    optionId: string,
    data: { text?: string; isCorrect?: boolean },
  ) {
    return await this.lessonsRepository.updateOption(optionId, data);
  }

  async removeOption(optionId: string) {
    return await this.lessonsRepository.removeOption(optionId);
  }
}
