import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthRepository } from '../repositories/auth.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let repository: jest.Mocked<Partial<AuthRepository>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;

  beforeEach(async () => {
    repository = {
      findUserByEmail: jest.fn(),
      createSession: jest.fn(),
      findSessionByTokenHash: jest.fn(),
      revokeSession: jest.fn(),
      revokeSessionByTokenHash: jest.fn(),
      revokeAllUserSessions: jest.fn(),
      findUserById: jest.fn(),
    };

    jwtService = {
      signAsync: jest
        .fn()
        .mockImplementation((payload: { sub: string }) =>
          Promise.resolve(`signed-token-for-${payload.sub}`),
        ),
      verifyAsync: jest.fn(),
    };

    configService = {
      get: jest
        .fn()
        .mockImplementation(
          <T = unknown>(_key: string, defaultValue?: T): T | undefined =>
            defaultValue,
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: repository },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      (repository.findUserByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const hashedPassword = await bcrypt.hash('different-password', 10);
      (repository.findUserByEmail as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true,
        roles: [{ name: 'USER' }],
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should login and return tokens when credentials are valid', async () => {
      const password = 'mypassword';
      const hashedPassword = await bcrypt.hash(password, 10);
      (repository.findUserByEmail as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true,
        name: 'John Doe',
        roles: [{ name: 'USER' }],
      });
      (repository.createSession as jest.Mock).mockResolvedValue({
        id: 'session-1',
      });

      const result = await service.login({
        email: 'test@example.com',
        password,
      });

      expect(result.user.id).toBe('user-1');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(repository.createSession).toHaveBeenCalled();
    });
  });
});
