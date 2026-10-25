import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentsService } from '../services/comments.service';
import { CommentsRepository } from '../repositories/comments.repository';

const comment = {
  id: 'comment-1',
  text: 'Buena clase',
  likes: 0,
  lessonId: 'lesson-1',
  userId: 'owner-1',
};

describe('CommentsService', () => {
  let service: CommentsService;
  let repository: Record<
    'create' | 'findAllByLesson' | 'findById' | 'update' | 'remove',
    jest.Mock
  >;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findAllByLesson: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: CommentsRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should connect the comment to the lesson and the user', async () => {
      repository.create.mockResolvedValue(comment);

      await service.create('owner-1', { lessonId: 'lesson-1', text: 'Hola' });

      expect(repository.create).toHaveBeenCalledWith({
        text: 'Hola',
        lesson: { connect: { id: 'lesson-1' } },
        user: { connect: { id: 'owner-1' } },
      });
    });
  });

  describe('findAllByLesson', () => {
    it('should delegate to the repository', async () => {
      repository.findAllByLesson.mockResolvedValue([comment]);

      await expect(service.findAllByLesson('lesson-1')).resolves.toEqual([
        comment,
      ]);
      expect(repository.findAllByLesson).toHaveBeenCalledWith('lesson-1');
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when the comment does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    beforeEach(() => repository.findById.mockResolvedValue(comment));

    it('should let the owner edit the text', async () => {
      await service.update('comment-1', 'owner-1', { text: 'Editado' });

      expect(repository.update).toHaveBeenCalledWith('comment-1', {
        text: 'Editado',
      });
    });

    it('should forbid editing the text of another user comment', async () => {
      await expect(
        service.update('comment-1', 'other-user', { text: 'Hack' }),
      ).rejects.toThrow(ForbiddenException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should let any user update the likes', async () => {
      await service.update('comment-1', 'other-user', { likes: 3 });

      expect(repository.update).toHaveBeenCalledWith('comment-1', {
        likes: 3,
      });
    });
  });

  describe('remove', () => {
    beforeEach(() => repository.findById.mockResolvedValue(comment));

    it('should let the owner delete the comment', async () => {
      await service.remove('comment-1', 'owner-1', 'USER');

      expect(repository.remove).toHaveBeenCalledWith('comment-1');
    });

    it.each(['ADMIN', 'SUPERADMIN'])(
      'should let %s delete any comment',
      async (role) => {
        await service.remove('comment-1', 'admin-1', role);

        expect(repository.remove).toHaveBeenCalledWith('comment-1');
      },
    );

    it.each(['USER', 'DOCENTE'])(
      'should forbid %s deleting another user comment',
      async (role) => {
        await expect(
          service.remove('comment-1', 'other-user', role),
        ).rejects.toThrow(ForbiddenException);
        expect(repository.remove).not.toHaveBeenCalled();
      },
    );
  });
});
