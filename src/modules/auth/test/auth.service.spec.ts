import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../services/auth.service';
import { AuthRepository } from '../repositories/auth.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';

const sha256 = (value: string) =>
  crypto.createHash('sha256').update(value).digest('hex');

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

    it('should throw UnauthorizedException if the user is inactive', async () => {
      (repository.findUserByEmail as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: await bcrypt.hash('mypassword', 4),
        isActive: false,
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'mypassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const hashedPassword = await bcrypt.hash('different-password', 4);
      (repository.findUserByEmail as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true,
        role: { name: 'USER' },
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(repository.createSession).not.toHaveBeenCalled();
    });

    it('should normalise the email before looking up the user', async () => {
      (repository.findUserByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: '  Test@Example.COM ', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(repository.findUserByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('should login and return tokens when credentials are valid', async () => {
      const password = 'mypassword';
      const hashedPassword = await bcrypt.hash(password, 4);
      (repository.findUserByEmail as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true,
        name: 'John Doe',
        role: { name: 'DOCENTE' },
      });
      (repository.createSession as jest.Mock).mockResolvedValue({
        id: 'session-1',
      });

      const result = await service.login(
        { email: 'test@example.com', password },
        { userAgent: 'jest', ipAddress: '127.0.0.1' },
      );

      expect(result).toEqual({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'John Doe',
          role: 'DOCENTE',
        },
        accessToken: 'signed-token-for-user-1',
        refreshToken: 'signed-token-for-user-1',
      });
      expect(repository.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          refreshTokenHash: sha256('signed-token-for-user-1'),
          userAgent: 'jest',
          ipAddress: '127.0.0.1',
        }),
      );
    });

    it('should default the role to USER when the user has none', async () => {
      (repository.findUserByEmail as jest.Mock).mockResolvedValue({
        id: 'user-2',
        email: 'a@mail.com',
        password: await bcrypt.hash('pw', 4),
        isActive: true,
        role: null,
      });

      const result = await service.login({
        email: 'a@mail.com',
        password: 'pw',
      });

      expect(result.user.role).toBe('USER');
    });
  });

  describe('refreshTokens', () => {
    const activeSession = {
      id: 'session-1',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 60_000),
      userAgent: 'old-agent',
      ipAddress: '10.0.0.1',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'John',
        isActive: true,
        role: { name: 'ADMIN' },
      },
    };

    it('should reject an invalid or expired refresh token', async () => {
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
        new Error('jwt expired'),
      );

      await expect(service.refreshTokens('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(repository.findSessionByTokenHash).not.toHaveBeenCalled();
    });

    it.each([
      ['missing', null],
      ['revoked', { ...activeSession, isRevoked: true }],
      ['expired', { ...activeSession, expiresAt: new Date(Date.now() - 1) }],
    ])('should reject a %s session', async (_label, session) => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({});
      (repository.findSessionByTokenHash as jest.Mock).mockResolvedValue(
        session,
      );

      await expect(service.refreshTokens('token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(repository.revokeSession).not.toHaveBeenCalled();
    });

    it('should reject the refresh when the user is inactive', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({});
      (repository.findSessionByTokenHash as jest.Mock).mockResolvedValue({
        ...activeSession,
        user: { ...activeSession.user, isActive: false },
      });

      await expect(service.refreshTokens('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should rotate the session and keep the previous metadata', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({});
      (repository.findSessionByTokenHash as jest.Mock).mockResolvedValue(
        activeSession,
      );

      const result = await service.refreshTokens('old-refresh');

      expect(repository.findSessionByTokenHash).toHaveBeenCalledWith(
        sha256('old-refresh'),
      );
      expect(repository.revokeSession).toHaveBeenCalledWith('session-1');
      expect(repository.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          userAgent: 'old-agent',
          ipAddress: '10.0.0.1',
        }),
      );
      expect(result.user.role).toBe('ADMIN');
    });
  });

  describe('logout', () => {
    it('should do nothing without a refresh token', async () => {
      await expect(service.logout('')).resolves.toEqual({
        message: 'Sesión cerrada',
      });
      expect(repository.revokeSessionByTokenHash).not.toHaveBeenCalled();
    });

    it('should revoke the session of the refresh token', async () => {
      await service.logout('refresh-1');

      expect(repository.revokeSessionByTokenHash).toHaveBeenCalledWith(
        sha256('refresh-1'),
      );
    });
  });

  describe('logoutAll', () => {
    it('should revoke all the sessions of the user', async () => {
      await service.logoutAll('user-1');

      expect(repository.revokeAllUserSessions).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getProfile', () => {
    it('should throw UnauthorizedException when the user does not exist', async () => {
      (repository.findUserById as jest.Mock).mockResolvedValue(null);

      await expect(service.getProfile('missing')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return the profile without the password', async () => {
      const createdAt = new Date();
      (repository.findUserById as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'John',
        password: 'hash',
        isActive: true,
        role: { name: 'DOCENTE' },
        createdAt,
      });

      await expect(service.getProfile('user-1')).resolves.toEqual({
        id: 'user-1',
        email: 'test@example.com',
        name: 'John',
        isActive: true,
        role: 'DOCENTE',
        createdAt,
      });
    });
  });
});
