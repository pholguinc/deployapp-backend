import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LessonsService } from '../services/lessons.service';
import { LessonsRepository } from '../repositories/lessons.repository';
import { UploadService } from '../../upload/upload.service';

const lesson = { id: 'lesson-1', title: 'Intro', videoUrl: null };

const buildFile = (originalname: string, size = 2048) =>
  ({ originalname, size, buffer: Buffer.from('x') }) as Express.Multer.File;

describe('LessonsService', () => {
  let service: LessonsService;
  let repository: Record<string, jest.Mock>;
  let uploadService: { uploadFile: jest.Mock; deleteFile: jest.Mock };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findAllByModule: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      toggleLessonComplete: jest.fn(),
      findByIdWithCourseId: jest.fn(),
      createResource: jest.fn(),
      findResourcesByLesson: jest.fn(),
      findResourceById: jest.fn(),
      removeResource: jest.fn(),
      updateResource: jest.fn(),
      createQuiz: jest.fn(),
      findQuizzesByLesson: jest.fn(),
      findQuizById: jest.fn(),
      updateQuiz: jest.fn(),
      removeQuiz: jest.fn(),
      createQuestion: jest.fn(),
      findQuestionById: jest.fn(),
      updateQuestion: jest.fn(),
      removeQuestion: jest.fn(),
      updateOption: jest.fn(),
      removeOption: jest.fn(),
    };
    uploadService = {
      uploadFile: jest.fn().mockResolvedValue('https://cdn/file'),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonsService,
        { provide: LessonsRepository, useValue: repository },
        { provide: UploadService, useValue: uploadService },
      ],
    }).compile();

    service = module.get<LessonsService>(LessonsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should connect the lesson to its module', async () => {
      await service.create({
        title: 'Intro',
        moduleId: 'module-1',
      });

      expect(repository.create).toHaveBeenCalledWith({
        title: 'Intro',
        module: { connect: { id: 'module-1' } },
      });
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when the lesson does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    beforeEach(() => repository.findById.mockResolvedValue(lesson));

    it('should move the lesson when a moduleId is sent', async () => {
      await service.update('lesson-1', {
        title: 'Nuevo',
        moduleId: 'module-2',
      });

      expect(repository.update).toHaveBeenCalledWith('lesson-1', {
        title: 'Nuevo',
        module: { connect: { id: 'module-2' } },
      });
    });

    it('should not touch the module when no moduleId is sent', async () => {
      await service.update('lesson-1', { title: 'Nuevo' });

      expect(repository.update).toHaveBeenCalledWith('lesson-1', {
        title: 'Nuevo',
      });
    });
  });

  describe('remove', () => {
    it('should delete the video from storage before removing the lesson', async () => {
      repository.findById.mockResolvedValue({
        ...lesson,
        videoUrl: 'https://cdn/video.mp4',
      });

      await service.remove('lesson-1');

      expect(uploadService.deleteFile).toHaveBeenCalledWith(
        'https://cdn/video.mp4',
      );
      expect(repository.remove).toHaveBeenCalledWith('lesson-1');
    });

    it('should not call storage when the lesson has no video', async () => {
      repository.findById.mockResolvedValue(lesson);

      await service.remove('lesson-1');

      expect(uploadService.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe('toggleLessonComplete', () => {
    it('should return the new completion state', async () => {
      repository.findById.mockResolvedValue(lesson);
      repository.toggleLessonComplete.mockResolvedValue(true);

      await expect(
        service.toggleLessonComplete('u1', 'lesson-1'),
      ).resolves.toEqual({ completed: true });
    });
  });

  describe('uploadVideo', () => {
    it('should throw NotFoundException when the lesson does not exist', async () => {
      repository.findByIdWithCourseId.mockResolvedValue(null);

      await expect(
        service.uploadVideo('missing', buildFile('v.mp4')),
      ).rejects.toThrow(NotFoundException);
    });

    it('should replace the old video in the lesson folder', async () => {
      repository.findByIdWithCourseId.mockResolvedValue({
        ...lesson,
        videoUrl: 'https://cdn/old.mp4',
        module: { courseId: 'course-1' },
      });
      const file = buildFile('new.mp4');

      await service.uploadVideo('lesson-1', file);

      expect(uploadService.deleteFile).toHaveBeenCalledWith(
        'https://cdn/old.mp4',
      );
      expect(uploadService.uploadFile).toHaveBeenCalledWith(
        file,
        'courses/course-1/lessons/lesson-1',
      );
      expect(repository.update).toHaveBeenCalledWith('lesson-1', {
        videoUrl: 'https://cdn/file',
      });
    });
  });

  describe('addResource', () => {
    beforeEach(() => repository.findById.mockResolvedValue(lesson));

    it.each([
      ['guia.pdf', 'PDF'],
      ['notas.DOCX', 'DOC'],
      ['captura.png', 'IMAGE'],
      ['demo.mp4', 'VIDEO'],
      ['codigo.zip', 'ZIP'],
      ['archivo.xyz', 'FILE'],
    ])('should infer the type of %s as %s', async (name, type) => {
      await service.addResource('lesson-1', buildFile(name));

      expect(repository.createResource).toHaveBeenCalledWith(
        expect.objectContaining({ name, type }),
      );
    });

    it.each([
      [512, '512 B'],
      [2048, '2.0 KB'],
      [3.8 * 1024 * 1024, '3.8 MB'],
    ])('should format %d bytes as %s', async (size, expected) => {
      await service.addResource('lesson-1', buildFile('a.pdf', size));

      expect(repository.createResource).toHaveBeenCalledWith(
        expect.objectContaining({ size: expected }),
      );
    });

    it('should keep the name and type sent by the client', async () => {
      await service.addResource(
        'lesson-1',
        buildFile('a.pdf'),
        'Guía oficial',
        'LINK',
      );

      expect(repository.createResource).toHaveBeenCalledWith({
        name: 'Guía oficial',
        type: 'LINK',
        size: '2.0 KB',
        url: 'https://cdn/file',
        lesson: { connect: { id: 'lesson-1' } },
      });
      expect(uploadService.uploadFile).toHaveBeenCalledWith(
        expect.anything(),
        'resources',
      );
    });
  });

  describe('removeResource', () => {
    it('should throw NotFoundException when the resource does not exist', async () => {
      repository.findResourceById.mockResolvedValue(null);

      await expect(service.removeResource('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete the file and the resource', async () => {
      repository.findResourceById.mockResolvedValue({
        id: 'res-1',
        url: 'https://cdn/res.pdf',
      });

      await service.removeResource('res-1');

      expect(uploadService.deleteFile).toHaveBeenCalledWith(
        'https://cdn/res.pdf',
      );
      expect(repository.removeResource).toHaveBeenCalledWith('res-1');
    });
  });

  describe('updateResourceFile', () => {
    it('should replace the stored file and update the resource data', async () => {
      repository.findResourceById.mockResolvedValue({
        id: 'res-1',
        url: 'https://cdn/old.pdf',
      });

      await service.updateResourceFile('res-1', buildFile('nuevo.xlsx', 512));

      expect(uploadService.deleteFile).toHaveBeenCalledWith(
        'https://cdn/old.pdf',
      );
      expect(repository.updateResource).toHaveBeenCalledWith('res-1', {
        name: 'nuevo.xlsx',
        type: 'XLS',
        size: '512 B',
        url: 'https://cdn/file',
      });
    });
  });

  describe('createQuiz', () => {
    beforeEach(() => repository.findById.mockResolvedValue(lesson));

    it('should create nested questions and default isCorrect to false', async () => {
      await service.createQuiz({
        lessonId: 'lesson-1',
        title: 'Quiz 1',
        questions: [
          {
            text: '¿Qué es Docker?',
            options: [
              { text: 'Contenedores', isCorrect: true },
              { text: 'VM' },
            ],
          },
        ],
      });

      expect(repository.createQuiz).toHaveBeenCalledWith({
        title: 'Quiz 1',
        lesson: { connect: { id: 'lesson-1' } },
        questions: {
          create: [
            {
              text: '¿Qué es Docker?',
              options: {
                create: [
                  { text: 'Contenedores', isCorrect: true },
                  { text: 'VM', isCorrect: false },
                ],
              },
            },
          ],
        },
      });
    });

    it('should create a quiz without questions', async () => {
      await service.createQuiz({
        lessonId: 'lesson-1',
        title: 'Vacío',
        questions: [],
      });

      expect(repository.createQuiz).toHaveBeenCalledWith({
        title: 'Vacío',
        lesson: { connect: { id: 'lesson-1' } },
      });
    });
  });

  describe('quizzes', () => {
    it('should throw NotFoundException when the quiz does not exist', async () => {
      repository.findQuizById.mockResolvedValue(null);

      await expect(service.getQuizById('missing')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.removeQuiz('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.removeQuiz).not.toHaveBeenCalled();
    });

    it('should add a question to an existing quiz', async () => {
      repository.findQuizById.mockResolvedValue({ id: 'quiz-1' });

      await service.addQuestion('quiz-1', {
        text: 'Pregunta',
        options: [{ text: 'A' }],
      });

      expect(repository.createQuestion).toHaveBeenCalledWith({
        text: 'Pregunta',
        quiz: { connect: { id: 'quiz-1' } },
        options: { create: [{ text: 'A', isCorrect: false }] },
      });
    });
  });

  describe('questions', () => {
    it('should throw NotFoundException when updating a missing question', async () => {
      repository.findQuestionById.mockResolvedValue(null);

      await expect(
        service.updateQuestion('missing', { text: 'x' }),
      ).rejects.toThrow(NotFoundException);
      await expect(service.removeQuestion('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should remove an existing question', async () => {
      repository.findQuestionById.mockResolvedValue({ id: 'q1' });

      await service.removeQuestion('q1');

      expect(repository.removeQuestion).toHaveBeenCalledWith('q1');
    });
  });
});
