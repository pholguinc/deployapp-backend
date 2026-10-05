import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from '../repositories/users.repository';
import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Partial<UsersRepository>>;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if email is already registered', async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '7.8.0',
        },
      );
      (repository.create as jest.Mock).mockRejectedValue(p2002Error);

      await expect(
        service.create({
          email: 'test@example.com',
          password: 'password123',
          roleId: 'role-uuid-1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user without returning password', async () => {
      (repository.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password-123',
        name: 'Docente Test',
        isActive: true,
        role: {
          id: 'role-uuid-1',
          name: 'DOCENTE',
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Docente Test',
        lastname: 'Apellido Test',
        roleId: 'role-uuid-1',
      });

      expect(result.id).toBe('user-1');
      expect(result.role?.name).toBe('DOCENTE');
      expect((result as Record<string, unknown>).password).toBeUndefined();
      expect((result as Record<string, unknown>).roleId).toBeUndefined();
      expect(repository.create).toHaveBeenCalled();
    });
  });
});
