import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SettingsService } from '../services/settings.service';
import { SettingsRepository } from '../repositories/settings.repository';

const setting = {
  id: 'setting-1',
  key: 'passing_score',
  value: { min: 15 },
  description: 'Nota mínima',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('SettingsService', () => {
  let service: SettingsService;
  let repository: Record<'findByKey' | 'findAll' | 'upsert', jest.Mock>;

  beforeEach(async () => {
    repository = {
      findByKey: jest.fn(),
      findAll: jest.fn(),
      upsert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: SettingsRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getByKey', () => {
    it('should return the setting when it exists', async () => {
      repository.findByKey.mockResolvedValue(setting);

      await expect(service.getByKey('passing_score')).resolves.toBe(setting);
    });

    it('should throw NotFoundException when the key does not exist', async () => {
      repository.findByKey.mockResolvedValue(null);

      await expect(service.getByKey('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getByKeyOrDefault', () => {
    it('should return the stored value', async () => {
      repository.findByKey.mockResolvedValue(setting);

      await expect(
        service.getByKeyOrDefault('passing_score', { min: 10 }),
      ).resolves.toEqual({ min: 15 });
    });

    it('should return the default value when the key does not exist', async () => {
      repository.findByKey.mockResolvedValue(null);

      await expect(
        service.getByKeyOrDefault('missing', { min: 10 }),
      ).resolves.toEqual({ min: 10 });
    });
  });

  describe('getAll', () => {
    it('should delegate to the repository', async () => {
      repository.findAll.mockResolvedValue([setting]);

      await expect(service.getAll()).resolves.toEqual([setting]);
    });
  });

  describe('upsert', () => {
    it('should pass the key, value and description to the repository', async () => {
      repository.upsert.mockResolvedValue(setting);

      await service.upsert('passing_score', {
        value: { min: 15 },
        description: 'Nota mínima',
      });

      expect(repository.upsert).toHaveBeenCalledWith(
        'passing_score',
        { min: 15 },
        'Nota mínima',
      );
    });
  });
});
