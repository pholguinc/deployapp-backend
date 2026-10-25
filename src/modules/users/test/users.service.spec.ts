import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../services/users.service';
import { UsersRepository } from '../repositories/users.repository';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

const dbUser = {
  id: 'user-1',
  email: 'test@example.com',
  password: 'hashed-password',
  roleId: 'role-uuid-1',
  name: 'Docente Test',
  lastname: null,
  phone: null,
  isActive: true,
  role: { id: 'role-uuid-1', name: 'DOCENTE' },
  createdAt: new Date(),
  updatedAt: new Date(),
};

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
          name: 'Docente Test',
          lastname: 'Apellido Test',
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
      expect(
        (result as unknown as Record<string, unknown>).password,
      ).toBeUndefined();
      expect(
        (result as unknown as Record<string, unknown>).roleId,
      ).toBeUndefined();
      expect(repository.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should paginate, filter by role and hide sensitive fields', async () => {
      (repository.findAll as jest.Mock).mockResolvedValue([
        [{ ...dbUser }],
        11,
      ]);

      const result = await service.findAll(2, 5, 'DOCENTE');

      expect(repository.findAll).toHaveBeenCalledWith(5, 5, 'DOCENTE');
      expect(result.meta).toEqual({
        firstPage: 1,
        lastPage: 3,
        currentPage: 2,
        totalPages: 3,
        totalItems: 11,
      });
      expect(result.data[0]).not.toHaveProperty('password');
      expect(result.data[0]).not.toHaveProperty('roleId');
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when the user does not exist', async () => {
      (repository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    type UpdateCall = [string, { password?: string; role?: unknown }];
    const updateCalls = () =>
      (repository.update as jest.Mock).mock.calls as UpdateCall[];

    beforeEach(() => {
      (repository.findById as jest.Mock).mockResolvedValue({ ...dbUser });
      (repository.update as jest.Mock).mockResolvedValue({ ...dbUser });
    });

    it('should hash the new password', async () => {
      await service.update('user-1', { password: 'nueva123' });

      const [, data] = updateCalls()[0];
      expect(data.password).not.toBe('nueva123');
      await expect(bcrypt.compare('nueva123', data.password!)).resolves.toBe(
        true,
      );
    });

    it('should not change the password when none is sent', async () => {
      await service.update('user-1', { name: 'Nuevo' });

      const [, data] = updateCalls()[0];
      expect(data).not.toHaveProperty('password');
      expect(data).not.toHaveProperty('role');
    });

    it('should connect a new role or disconnect it with an empty roleId', async () => {
      await service.update('user-1', { roleId: 'role-2' });
      await service.update('user-1', { roleId: '' });

      const calls = updateCalls();
      expect(calls[0][1].role).toEqual({ connect: { id: 'role-2' } });
      expect(calls[1][1].role).toEqual({ disconnect: true });
    });

    it('should throw ConflictException when the email is taken', async () => {
      (repository.update as jest.Mock).mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '7.8.0',
        }),
      );

      await expect(
        service.update('user-1', { email: 'taken@mail.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should not update a missing user', async () => {
      (repository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.update('missing', {})).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update only the active flag', async () => {
      (repository.findById as jest.Mock).mockResolvedValue({ ...dbUser });
      (repository.update as jest.Mock).mockResolvedValue({
        ...dbUser,
        isActive: false,
      });

      const result = await service.updateStatus('user-1', { isActive: false });

      expect(repository.update).toHaveBeenCalledWith('user-1', {
        isActive: false,
      });
      expect(result.isActive).toBe(false);
    });
  });
});
