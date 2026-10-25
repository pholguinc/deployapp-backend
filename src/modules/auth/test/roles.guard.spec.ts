import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../guards/roles.guard';

const buildContext = (user?: { role?: string }) =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it.each([undefined, []])(
    'should allow access when no roles are required (%p)',
    (roles) => {
      reflector.getAllAndOverride.mockReturnValue(roles);

      expect(guard.canActivate(buildContext())).toBe(true);
    },
  );

  it('should allow a user with one of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'DOCENTE']);

    expect(guard.canActivate(buildContext({ role: 'DOCENTE' }))).toBe(true);
  });

  it('should forbid a user without the required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(() => guard.canActivate(buildContext({ role: 'USER' }))).toThrow(
      ForbiddenException,
    );
  });

  it('should forbid a request without an authenticated user', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(() => guard.canActivate(buildContext())).toThrow(ForbiddenException);
  });
});
