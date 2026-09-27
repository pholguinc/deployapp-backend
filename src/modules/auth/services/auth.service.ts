import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { Session } from '@prisma/client';
import {
  AuthRepository,
  SessionWithUser,
  UserWithRole,
} from '../repositories/auth.repository';
import { LoginDto } from '../dtos/requests/login.request.dto';
import { AuthResponseDto } from '../dtos/responses/auth.response.dto';
import { UserProfileResponse } from '../dtos/responses/user-profile.response.dto';
import { SessionMetadata } from '../interfaces/session-metadata.interface';
import { JwtTokenPayload } from '../interfaces/jwt-payload.interface';
import { envs } from '../../../config/envs';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    dto: LoginDto,
    metadata?: SessionMetadata,
  ): Promise<AuthResponseDto> {
    const user: UserWithRole | null =
      await this.authRepository.findUserByEmail(dto.email.toLowerCase().trim());
    if (!user?.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid: boolean = await bcrypt.compare(
      dto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const role: string = user.role?.name || 'USER';
    const tokens: { accessToken: string; refreshToken: string } =
      await this.generateTokens(user.id, user.email, role);

    await this.createSession(user.id, tokens.refreshToken, metadata);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshTokens(
    refreshToken: string,
    metadata?: SessionMetadata,
  ): Promise<AuthResponseDto> {
    const refreshSecret: string = envs.jwtRefreshSecret;

    try {
      await this.jwtService.verifyAsync<JwtTokenPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token expirado o inválido');
    }

    const hash: string = this.hashToken(refreshToken);
    const session: SessionWithUser | null =
      await this.authRepository.findSessionByTokenHash(hash);

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Sesión expirada o revocada');
    }

    // Rotación de token: revocamos la sesión anterior
    await this.authRepository.revokeSession(session.id);

    const user: UserWithRole = session.user;
    if (!user?.isActive) {
      throw new UnauthorizedException('Usuario inactivo o no encontrado');
    }

    const role: string = user.role?.name || 'USER';
    const tokens: { accessToken: string; refreshToken: string } =
      await this.generateTokens(user.id, user.email, role);

    await this.createSession(user.id, tokens.refreshToken, {
      userAgent: metadata?.userAgent ?? session.userAgent ?? undefined,
      ipAddress: metadata?.ipAddress ?? session.ipAddress ?? undefined,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    if (!refreshToken) {
      return { message: 'Sesión cerrada' };
    }
    const hash: string = this.hashToken(refreshToken);
    await this.authRepository.revokeSessionByTokenHash(hash);
    return { message: 'Sesión cerrada exitosamente' };
  }

  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.authRepository.revokeAllUserSessions(userId);
    return { message: 'Todas las sesiones han sido cerradas exitosamente' };
  }

  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user: UserWithRole | null =
      await this.authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      role: user.role?.name || 'USER',
      createdAt: user.createdAt,
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtTokenPayload = { sub: userId, email, role };

    const accessSecret: string = envs.jwtAccessSecret;
    const accessExpiresIn: JwtSignOptions['expiresIn'] =
      envs.jwtAccessExpiresIn;

    const refreshSecret: string = envs.jwtRefreshSecret;
    const refreshExpiresIn: JwtSignOptions['expiresIn'] =
      envs.jwtRefreshExpiresIn;

    const [accessToken, refreshToken]: [string, string] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async createSession(
    userId: string,
    refreshToken: string,
    metadata?: SessionMetadata,
  ): Promise<Session> {
    const refreshTokenHash: string = this.hashToken(refreshToken);
    // 7 días por defecto
    const expiresAt: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.authRepository.createSession({
      userId,
      refreshTokenHash,
      expiresAt,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    });
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
