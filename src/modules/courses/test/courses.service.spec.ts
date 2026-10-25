import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CoursesService } from '../services/courses.service';
import { CoursesRepository } from '../repositories/courses.repository';
import { UploadService } from '../../upload/upload.service';

const courseDetail = {
  id: 'course-1',
  title: 'Docker',
  modules: [
    { id: 'm1', lessons: [{ id: 'l1' }, { id: 'l2' }] },
    { id: 'm2', lessons: [{ id: 'l3' }] },
  ],
  _count: { users: 4 },
};

describe('CoursesService', () => {
  let service: CoursesService;
  let repository: Record<
    | 'create'
    | 'findAll'
    | 'findById'
    | 'update'
    | 'remove'
    | 'addModule'
    | 'updateModule'
    | 'removeModule'
    | 'enrollUser'
    | 'getUserCourseProgress'
    | 'updateUserProgress'
    | 'upsertReview'
    | 'calculateAverageRating'
    | 'getReviews',
    jest.Mock
  >;
  let uploadService: { uploadFile: jest.Mock };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn().mockResolvedValue([[], 0]),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      addModule: jest.fn(),
      updateModule: jest.fn(),
      removeModule: jest.fn(),
      enrollUser: jest.fn(),
      getUserCourseProgress: jest.fn(),
      updateUserProgress: jest.fn(),
      upsertReview: jest.fn(),
      calculateAverageRating: jest.fn(),
      getReviews: jest.fn(),
    };
    uploadService = { uploadFile: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: CoursesRepository, useValue: repository },
        { provide: UploadService, useValue: uploadService },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should connect the instructor when provided', async () => {
      await service.create({
        title: 'Docker',
        instructor: 'inst-1',
      });

      expect(repository.create).toHaveBeenCalledWith({
        title: 'Docker',
        instructor: { connect: { id: 'inst-1' } },
      });
    });

    it('should leave the instructor undefined when not provided', async () => {
      await service.create({ title: 'Docker' });

      expect(repository.create).toHaveBeenCalledWith({
        title: 'Docker',
        instructor: undefined,
      });
    });
  });

  describe('findAll', () => {
    const findAllArgs = () => repository.findAll.mock.calls[0] as unknown[];
    const whereUsed = () => findAllArgs()[2];

    it('should show the active catalog to anonymous users', async () => {
      await service.findAll(1, 10, null);

      expect(whereUsed()).toEqual({ isActive: true });
    });

    it.each(['ADMIN', 'SUPERADMIN', 'admin'])(
      'should not filter courses for %s',
      async (role) => {
        await service.findAll(1, 10, { id: 'u1', role });

        expect(whereUsed()).toBeUndefined();
      },
    );

    it('should show a DOCENTE only the courses they teach', async () => {
      await service.findAll(1, 10, { id: 'doc-1', role: 'DOCENTE' });

      expect(whereUsed()).toEqual({ instructorId: 'doc-1' });
    });

    it('should show a USER only the enrolled courses by default', async () => {
      await service.findAll(1, 10, { id: 'u1', role: 'USER' });

      expect(whereUsed()).toEqual({ users: { some: { userId: 'u1' } } });
    });

    it.each(['catalog', 'all'])(
      'should show a USER the active catalog with scope %s',
      async (scope) => {
        await service.findAll(1, 10, { id: 'u1', role: 'USER' }, scope);

        expect(whereUsed()).toEqual({ isActive: true });
      },
    );

    it('should combine the role filter with the trimmed search', async () => {
      await service.findAll(1, 10, null, undefined, '  docker ');

      expect(whereUsed()).toEqual({
        AND: [
          { isActive: true },
          {
            OR: [
              { title: { contains: 'docker', mode: 'insensitive' } },
              { description: { contains: 'docker', mode: 'insensitive' } },
              { category: { contains: 'docker', mode: 'insensitive' } },
            ],
          },
        ],
      });
    });

    it('should use only the search filter for admins', async () => {
      await service.findAll(
        1,
        10,
        { id: 'a1', role: 'ADMIN' },
        undefined,
        'k8s',
      );

      expect(whereUsed()).toHaveProperty('OR');
    });

    it('should count lessons and students and paginate', async () => {
      repository.findAll.mockResolvedValue([
        [
          {
            id: 'course-1',
            title: 'Docker',
            modules: [{ _count: { lessons: 3 } }, { _count: { lessons: 2 } }],
            _count: { users: 7 },
          },
        ],
        21,
      ]);

      const result = await service.findAll(3, 10, null);

      expect(repository.findAll).toHaveBeenCalledWith(20, 10, {
        isActive: true,
      });
      expect(result.data).toEqual([
        { id: 'course-1', title: 'Docker', lessonsCount: 5, studentsCount: 7 },
      ]);
      expect(result.meta).toMatchObject({ currentPage: 3, totalPages: 3 });
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when the course does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should count the lessons of all modules and the students', async () => {
      repository.findById.mockResolvedValue(courseDetail);

      const result = await service.findOne('course-1');

      expect(result).toMatchObject({ lessonsCount: 3, studentsCount: 4 });
      expect(result).not.toHaveProperty('_count');
    });
  });

  describe('update', () => {
    it('should connect the new instructor after checking the course exists', async () => {
      repository.findById.mockResolvedValue(courseDetail);

      await service.update('course-1', {
        title: 'Docker Pro',
        instructor: 'inst-2',
      });

      expect(repository.update).toHaveBeenCalledWith('course-1', {
        title: 'Docker Pro',
        instructor: { connect: { id: 'inst-2' } },
      });
    });
  });

  describe('remove', () => {
    it('should not remove a missing course', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });

  describe('uploadImage', () => {
    it('should upload to the courses folder and save the URL', async () => {
      repository.findById.mockResolvedValue(courseDetail);
      uploadService.uploadFile.mockResolvedValue('https://cdn/courses/img.png');
      const file = { originalname: 'img.png' } as Express.Multer.File;

      await service.uploadImage('course-1', file);

      expect(uploadService.uploadFile).toHaveBeenCalledWith(file, 'courses');
      expect(repository.update).toHaveBeenCalledWith('course-1', {
        imageUrl: 'https://cdn/courses/img.png',
      });
    });
  });

  describe('addModule', () => {
    it('should add the module to an existing course', async () => {
      repository.findById.mockResolvedValue(courseDetail);

      await service.addModule('course-1', { title: 'Intro', order: 1 });

      expect(repository.addModule).toHaveBeenCalledWith('course-1', {
        title: 'Intro',
        order: 1,
      });
    });
  });

  describe('enrollUser', () => {
    it('should not enroll in a missing course', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.enrollUser('u1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.enrollUser).not.toHaveBeenCalled();
    });
  });

  describe('checkEnrollmentStatus', () => {
    it('should report an enrolled user with the progress', async () => {
      const progress = { status: 'ENROLLED', progress: 40 };
      repository.getUserCourseProgress.mockResolvedValue(progress);

      await expect(
        service.checkEnrollmentStatus('u1', 'course-1'),
      ).resolves.toEqual({ isEnrolled: true, progress });
    });

    it('should report a user who is not enrolled', async () => {
      repository.getUserCourseProgress.mockResolvedValue(null);

      await expect(
        service.checkEnrollmentStatus('u1', 'course-1'),
      ).resolves.toEqual({ isEnrolled: false, progress: null });
    });
  });

  describe('addReview', () => {
    beforeEach(() => repository.findById.mockResolvedValue(courseDetail));

    it('should reject a review from a user who has not completed the course', async () => {
      repository.getUserCourseProgress.mockResolvedValue({
        status: 'ENROLLED',
      });

      await expect(
        service.addReview('u1', 'course-1', { rating: 5 }),
      ).rejects.toThrow(BadRequestException);
      expect(repository.upsertReview).not.toHaveBeenCalled();
    });

    it('should reject a review from a user who is not enrolled', async () => {
      repository.getUserCourseProgress.mockResolvedValue(null);

      await expect(
        service.addReview('u1', 'course-1', { rating: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should save the review and update the course rating', async () => {
      repository.getUserCourseProgress.mockResolvedValue({
        status: 'COMPLETED',
      });
      repository.upsertReview.mockResolvedValue({ id: 'review-1' });
      repository.calculateAverageRating.mockResolvedValue(4.5);

      const review = await service.addReview('u1', 'course-1', {
        rating: 5,
        comment: 'Excelente',
      });

      expect(repository.upsertReview).toHaveBeenCalledWith(
        'u1',
        'course-1',
        5,
        'Excelente',
      );
      expect(repository.update).toHaveBeenCalledWith('course-1', {
        rating: 4.5,
      });
      expect(review).toEqual({ id: 'review-1' });
    });
  });

  describe('getReviews', () => {
    it('should return the reviews of an existing course', async () => {
      repository.findById.mockResolvedValue(courseDetail);
      repository.getReviews.mockResolvedValue([{ id: 'review-1' }]);

      await expect(service.getReviews('course-1')).resolves.toEqual([
        { id: 'review-1' },
      ]);
    });
  });
});
