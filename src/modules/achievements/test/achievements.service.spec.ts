import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AchievementService } from '../services/achievements.service';
import { AchievementsRepository } from '../repositories/achievements.repository';
import { AchievementResponseDto } from '../dtos/responses/achievement.response.dto';

const achievement = {
  id: 'ach-1',
  name: 'Primer curso',
  icon: 'trophy',
  color: '#0db7ed',
  estado: true,
  orden: 0,
  createdBy: 'admin-1',
  updatedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AchievementService', () => {
  let service: AchievementService;
  let repository: Record<
    'create' | 'findAll' | 'findById' | 'update' | 'remove',
    jest.Mock
  >;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementService,
        { provide: AchievementsRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<AchievementService>(AchievementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should apply default estado and orden and set createdBy', async () => {
      repository.create.mockResolvedValue(achievement);

      const result = await service.create({ name: 'Primer curso' }, 'admin-1');

      expect(repository.create).toHaveBeenCalledWith({
        name: 'Primer curso',
        estado: true,
        orden: 0,
        createdBy: 'admin-1',
      });
      expect(result).toBeInstanceOf(AchievementResponseDto);
      expect(result.id).toBe('ach-1');
    });

    it('should keep estado and orden when provided', async () => {
      repository.create.mockResolvedValue(achievement);

      await service.create({ name: 'Oculto', estado: false, orden: 5 });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ estado: false, orden: 5 }),
      );
    });
  });

  describe('findAll', () => {
    it('should paginate with skip and compute the meta', async () => {
      repository.findAll.mockResolvedValue([[achievement], 25]);

      const result = await service.findAll(2, 10);

      expect(repository.findAll).toHaveBeenCalledWith(10, 10);
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        firstPage: 1,
        lastPage: 3,
        currentPage: 2,
        totalPages: 3,
        totalItems: 25,
      });
    });

    it('should report at least one page when there are no items', async () => {
      repository.findAll.mockResolvedValue([[], 0]);

      const result = await service.findAll();

      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when the achievement does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should set updatedBy after checking the achievement exists', async () => {
      repository.findById.mockResolvedValue(achievement);
      repository.update.mockResolvedValue({ ...achievement, name: 'Nuevo' });

      const result = await service.update(
        'ach-1',
        { name: 'Nuevo' },
        'admin-2',
      );

      expect(repository.update).toHaveBeenCalledWith('ach-1', {
        name: 'Nuevo',
        updatedBy: 'admin-2',
      });
      expect(result.name).toBe('Nuevo');
    });

    it('should not update a missing achievement', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('missing', {})).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove an existing achievement', async () => {
      repository.findById.mockResolvedValue(achievement);

      await service.remove('ach-1');

      expect(repository.remove).toHaveBeenCalledWith('ach-1');
    });

    it('should not remove a missing achievement', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
