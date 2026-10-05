import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  Prisma,
  Lesson,
  Resource,
  Quiz,
  Question,
  Option,
} from '@prisma/client';

@Injectable()
export class LessonsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.LessonCreateInput): Promise<Lesson> {
    return await this.prisma.lesson.create({ data });
  }

  async findAllByModule(moduleId: string): Promise<Lesson[]> {
    return this.prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
      include: {
        resources: true,
        quizzes: { include: { questions: { include: { options: true } } } },
      },
    });
  }

  async findById(id: string): Promise<Lesson | null> {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: {
        resources: true,
        comments: true,
        quizzes: { include: { questions: { include: { options: true } } } },
      },
    });
  }

  async findByIdWithCourseId(id: string) {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          select: { courseId: true },
        },
      },
    });
  }

  async update(id: string, data: Prisma.LessonUpdateInput): Promise<Lesson> {
    return this.prisma.lesson.update({ where: { id }, data });
  }

  async remove(id: string): Promise<Lesson> {
    return this.prisma.lesson.delete({ where: { id } });
  }

  // --- USER LESSON COMPLETION ---
  async toggleLessonComplete(
    userId: string,
    lessonId: string,
  ): Promise<boolean> {
    const existing = await this.prisma.userLesson.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    if (existing) {
      if (existing.completed) {
        await this.prisma.userLesson.delete({
          where: { userId_lessonId: { userId, lessonId } },
        });
        return false;
      } else {
        await this.prisma.userLesson.update({
          where: { userId_lessonId: { userId, lessonId } },
          data: { completed: true },
        });
        return true;
      }
    } else {
      await this.prisma.userLesson.create({
        data: { userId, lessonId, completed: true },
      });
      return true;
    }
  }

  // --- RESOURCES ---
  async createResource(data: Prisma.ResourceCreateInput): Promise<Resource> {
    return await this.prisma.resource.create({ data });
  }

  async findResourcesByLesson(lessonId: string): Promise<Resource[]> {
    return this.prisma.resource.findMany({
      where: { lessonId },
    });
  }

  async findResourceById(id: string): Promise<Resource | null> {
    return this.prisma.resource.findUnique({ where: { id } });
  }

  async updateResource(
    id: string,
    data: Prisma.ResourceUpdateInput,
  ): Promise<Resource> {
    return this.prisma.resource.update({ where: { id }, data });
  }

  async removeResource(id: string): Promise<Resource> {
    return this.prisma.resource.delete({ where: { id } });
  }

  // --- QUIZZES ---
  async createQuiz(data: Prisma.QuizCreateInput): Promise<Quiz> {
    return await this.prisma.quiz.create({
      data,
      include: { questions: { include: { options: true } } },
    });
  }

  async findQuizzesByLesson(lessonId: string): Promise<Quiz[]> {
    return this.prisma.quiz.findMany({
      where: { lessonId },
      include: { questions: { include: { options: true } } },
    });
  }

  async findQuizById(id: string): Promise<Quiz | null> {
    return this.prisma.quiz.findUnique({
      where: { id },
      include: { questions: { include: { options: true } } },
    });
  }

  async updateQuiz(id: string, data: Prisma.QuizUpdateInput): Promise<Quiz> {
    return this.prisma.quiz.update({
      where: { id },
      data,
      include: { questions: { include: { options: true } } },
    });
  }

  async removeQuiz(id: string): Promise<Quiz> {
    return this.prisma.quiz.delete({ where: { id } });
  }

  // --- QUESTIONS ---
  async createQuestion(data: Prisma.QuestionCreateInput): Promise<Question> {
    return await this.prisma.question.create({
      data,
      include: { options: true },
    });
  }

  async findQuestionById(id: string): Promise<Question | null> {
    return this.prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });
  }

  async updateQuestion(
    id: string,
    data: Prisma.QuestionUpdateInput,
  ): Promise<Question> {
    return this.prisma.question.update({
      where: { id },
      data,
      include: { options: true },
    });
  }

  async removeQuestion(id: string): Promise<Question> {
    return this.prisma.question.delete({ where: { id } });
  }

  // --- OPTIONS ---
  async updateOption(
    id: string,
    data: Prisma.OptionUpdateInput,
  ): Promise<Option> {
    return this.prisma.option.update({ where: { id }, data });
  }

  async removeOption(id: string): Promise<Option> {
    return this.prisma.option.delete({ where: { id } });
  }
}
