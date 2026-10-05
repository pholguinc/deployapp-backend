import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CoursesRepository } from '../repositories/courses.repository';
import { CreateCourseDto } from '../dtos/create-course.dto';
import { UpdateCourseDto } from '../dtos/update-course.dto';
import {
  CreateCourseModuleDto,
  UpdateCourseModuleDto,
} from '../dtos/course-module.dto';
import { UpdateUserCourseProgressDto } from '../dtos/user-course.dto';
import { CreateCourseReviewDto } from '../dtos/course-review.dto';
import { UploadService } from '../../upload/upload.service';

@Injectable()
export class CoursesService {
  constructor(
    private readonly coursesRepository: CoursesRepository,
    private readonly uploadService: UploadService,
  ) {}

  async uploadImage(id: string, file: Express.Multer.File) {
    await this.findOne(id);
    const imageUrl = await this.uploadService.uploadFile(file, 'courses');
    return await this.coursesRepository.update(id, { imageUrl });
  }

  // --- COURSES ---
  async create(createCourseDto: CreateCourseDto) {
    const { instructor, ...rest } = createCourseDto;
    const data: Prisma.CourseCreateInput = {
      ...rest,
      instructor: instructor ? { connect: { id: instructor } } : undefined,
    };
    return await this.coursesRepository.create(data);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [courses, totalItems] = await this.coursesRepository.findAll(
      skip,
      limit,
    );

    const data = courses.map((course) => {
      const lessonsCount =
        course.modules?.reduce(
          (acc, module) => acc + (module._count?.lessons || 0),
          0,
        ) || 0;

      const studentsCount = course._count?.users || 0;

      const { modules, _count, ...rest } = course;
      return { ...rest, lessonsCount, studentsCount };
    });

    return {
      data,
      meta: {
        totalItems,
        currentPage: page,
        lastPage: Math.ceil(totalItems / limit),
      },
    };
  }

  async findOne(id: string) {
    const course = await this.coursesRepository.findById(id);
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    const lessonsCount =
      course.modules?.reduce(
        (acc, module) => acc + (module.lessons?.length || 0),
        0,
      ) || 0;

    const studentsCount = course._count?.users || 0;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _count, ...rest } = course;

    return { ...rest, lessonsCount, studentsCount };
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    await this.findOne(id);
    const { instructor, ...rest } = updateCourseDto;
    const data: Prisma.CourseUpdateInput = {
      ...rest,
      instructor: instructor ? { connect: { id: instructor } } : undefined,
    };
    return await this.coursesRepository.update(id, data);
  }

  async remove(id: string) {
    await this.findOne(id);
    return await this.coursesRepository.remove(id);
  }

  // --- MODULES ---
  async addModule(courseId: string, createDto: CreateCourseModuleDto) {
    await this.findOne(courseId); // ensure course exists
    return await this.coursesRepository.addModule(courseId, createDto);
  }

  async updateModule(moduleId: string, updateDto: UpdateCourseModuleDto) {
    return await this.coursesRepository.updateModule(moduleId, updateDto);
  }

  async removeModule(moduleId: string) {
    return await this.coursesRepository.removeModule(moduleId);
  }

  // --- ENROLLMENTS ---
  async enrollUser(userId: string, courseId: string) {
    await this.findOne(courseId); // ensure course exists
    return await this.coursesRepository.enrollUser(userId, courseId);
  }

  async checkEnrollmentStatus(userId: string, courseId: string) {
    const progress = await this.coursesRepository.getUserCourseProgress(
      userId,
      courseId,
    );
    return {
      isEnrolled: !!progress,
      progress: progress || null,
    };
  }

  async updateProgress(
    userId: string,
    courseId: string,
    updateDto: UpdateUserCourseProgressDto,
  ) {
    return await this.coursesRepository.updateUserProgress(
      userId,
      courseId,
      updateDto,
    );
  }

  // --- REVIEWS ---
  async addReview(
    userId: string,
    courseId: string,
    dto: CreateCourseReviewDto,
  ) {
    const course = await this.findOne(courseId);

    // Verify user has completed the course
    const enrollment = await this.coursesRepository.getUserCourseProgress(
      userId,
      courseId,
    );
    if (enrollment?.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Only users who have completed the course can review it.',
      );
    }

    const review = await this.coursesRepository.upsertReview(
      userId,
      courseId,
      dto.rating,
      dto.comment,
    );

    // Recalculate average rating
    const newAverage =
      await this.coursesRepository.calculateAverageRating(courseId);

    // Update course rating
    await this.coursesRepository.update(courseId, { rating: newAverage });

    return review;
  }

  async getReviews(courseId: string) {
    await this.findOne(courseId);
    return await this.coursesRepository.getReviews(courseId);
  }
}
