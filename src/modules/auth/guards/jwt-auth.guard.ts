import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Si la ruta es pública pero el cliente envió un token Bearer, permitimos que Passport lo procese
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return super.canActivate(context);
      }
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // En ruta pública no lanzamos error si no hay usuario autenticado o el token expiró
      return user || null;
    }

    if (err || !user) {
      throw err || new UnauthorizedException('No autorizado');
    }

    return user;
  }
}
