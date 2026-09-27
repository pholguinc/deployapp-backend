import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from '../repositories/users.repository';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Partial<UsersRepository>>;

  beforeEach(async () => {
    repository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findRoleById: jest.fn(),
      findAllRoles: jest.fn(),
      findAll: jest.fn(),
      createUser: jest.fn(),
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

  describe('createUser', () => {
    it('should throw ConflictException if email is already registered', async () => {
      (repository.findByEmail as jest.Mock).mockResolvedValue({
        id: 'existing-id',
        email: 'test@example.com',
      });

      await expect(
        service.createUser({
          email: 'test@example.com',
          password: 'password123',
          roleId: 'role-uuid-1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if roleId does not exist', async () => {
      (repository.findByEmail as jest.Mock).mockResolvedValue(null);
      (repository.findRoleById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createUser({
          email: 'test@example.com',
          password: 'password123',
          roleId: 'non-existent-uuid',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create user with role UUID when valid', async () => {
      (repository.findByEmail as jest.Mock).mockResolvedValue(null);
      (repository.findRoleById as jest.Mock).mockResolvedValue({
        id: 'role-uuid-1',
        name: 'DOCENTE',
      });
      (repository.createUser as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Docente Test',
        isActive: true,
        roles: [
          {
            id: 'role-uuid-1',
            name: 'DOCENTE',
            description: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Docente Test',
        roleId: 'role-uuid-1',
      });

      expect(result.id).toBe('user-1');
      expect(result.roles[0].name).toBe('DOCENTE');
      expect(repository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          roleId: 'role-uuid-1',
        }),
      );
    });
  });
});
