import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  Prisma,
  Course,
  Module as CourseModuleModel,
  UserCourse,
} from '@prisma/client';

@Injectable()
export class CoursesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- COURSES ---
  async create(data: Prisma.CourseCreateInput): Promise<Course> {
    return await this.prisma.course.create({ data });
  }

  async findAll(skip?: number, take?: number, where?: Prisma.CourseWhereInput) {
    return Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          modules: {
            include: {
              _count: { select: { lessons: true } },
            },
          },
          _count: { select: { users: true } },
          instructor: {
            select: { id: true, name: true, lastname: true, email: true },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);
  }

  async findById(id: string) {
    return this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                resources: true,
                quizzes: {
                  include: { questions: { include: { options: true } } },
                },
              },
            },
          },
        },
        _count: { select: { users: true } },
        instructor: {
          select: { id: true, name: true, lastname: true, email: true },
        },
      },
    });
  }

  async update(id: string, data: Prisma.CourseUpdateInput): Promise<Course> {
    return this.prisma.course.update({ where: { id }, data });
  }

  async remove(id: string): Promise<Course> {
    return this.prisma.course.delete({ where: { id } });
  }

  // --- MODULES ---
  async addModule(
    courseId: string,
    data: Prisma.ModuleCreateWithoutCourseInput,
  ): Promise<CourseModuleModel> {
    return this.prisma.module.create({
      data: {
        ...data,
        course: { connect: { id: courseId } },
      },
    });
  }

  async updateModule(
    moduleId: string,
    data: Prisma.ModuleUpdateInput,
  ): Promise<CourseModuleModel> {
    return this.prisma.module.update({ where: { id: moduleId }, data });
  }

  async removeModule(moduleId: string): Promise<CourseModuleModel> {
    return this.prisma.module.delete({ where: { id: moduleId } });
  }

  // --- ENROLLMENTS ---
  async enrollUser(userId: string, courseId: string): Promise<UserCourse> {
    return this.prisma.userCourse.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {}, // if exists, do nothing (or we could throw an error if preferred)
      create: { userId, courseId, status: 'ENROLLED', progress: 0 },
    });
  }

  async updateUserProgress(
    userId: string,
    courseId: string,
    data: Prisma.UserCourseUpdateInput,
  ): Promise<UserCourse> {
    return this.prisma.userCourse.update({
      where: { userId_courseId: { userId, courseId } },
      data,
    });
  }

  // --- REVIEWS ---
  async upsertReview(
    userId: string,
    courseId: string,
    rating: number,
    comment?: string,
  ) {
    return this.prisma.courseReview.upsert({
      where: {
        courseId_userId: { courseId, userId },
      },
      update: {
        rating,
        comment,
      },
      create: {
        userId,
        courseId,
        rating,
        comment,
      },
    });
  }

  async getReviews(courseId: string) {
    return this.prisma.courseReview.findMany({
      where: { courseId },
      include: {
        user: {
          select: { id: true, name: true, lastname: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async calculateAverageRating(courseId: string): Promise<number> {
    const agg = await this.prisma.courseReview.aggregate({
      where: { courseId },
      _avg: { rating: true },
    });
    return agg._avg.rating || 0;
  }

  async getUserCourseProgress(userId: string, courseId: string) {
    const userCourse = await this.prisma.userCourse.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!userCourse) {
      return null;
    }

    const where: Prisma.UserLessonWhereInput = {
      userId,
      completed: true,
      lesson: {
        is: {
          module: {
            is: {
              courseId,
            },
          },
        },
      },
    };

    const completedLessons = await this.prisma.userLesson.findMany({
      where,
      select: {
        lessonId: true,
      },
    });

    return {
      ...userCourse,
      completedLessons: completedLessons.map(({ lessonId }) => lessonId),
    };
  }

  async countCourseLessons(courseId: string): Promise<number> {
    return this.prisma.lesson.count({
      where: {
        module: {
          courseId,
        },
      },
    });
  }

  async markCourseCompleted(userId: string, courseId: string) {
    return this.prisma.userCourse.update({
      where: { userId_courseId: { userId, courseId } },
      data: { status: 'COMPLETED', progress: 100 },
    });
  }
}
