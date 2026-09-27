import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { UserProfileResponse } from '../dtos/responses/user-profile.response.dto';
import { LoginDto } from '../dtos/requests/login.request.dto';
import { RefreshTokenDto } from '../dtos/requests/refresh-token.request.dto';
import { AuthResponseDto } from '../dtos/responses/auth.response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const metadata = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
    };
    return this.authService.login(dto, metadata);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const metadata = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
    };
    return this.authService.refreshTokens(dto.refreshToken, metadata);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RefreshTokenDto): Promise<{ message: string }> {
    return this.authService.logout(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser('id') userId: string): Promise<UserProfileResponse> {
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser('id') userId: string,
  ): Promise<{ message: string }> {
    return this.authService.logoutAll(userId);
  }
}
