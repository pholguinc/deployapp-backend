import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const buildContext = (authorization?: string) =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization } }),
    }),
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: JwtAuthGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new JwtAuthGuard(reflector as unknown as Reflector);
  });

  describe('canActivate', () => {
    it('should allow a public route without a token', () => {
      reflector.getAllAndOverride.mockReturnValue(true);

      expect(guard.canActivate(buildContext())).toBe(true);
    });

    it('should validate the token on a public route when one is sent', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const parentCanActivate = jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockReturnValue(true);

      guard.canActivate(buildContext('Bearer token'));

      expect(parentCanActivate).toHaveBeenCalled();
      parentCanActivate.mockRestore();
    });

    it('should validate the token on a protected route', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const parentCanActivate = jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockReturnValue(true);

      guard.canActivate(buildContext());

      expect(parentCanActivate).toHaveBeenCalled();
      parentCanActivate.mockRestore();
    });
  });

  describe('handleRequest', () => {
    const user = { id: 'user-1', role: 'USER' };

    it('should return the user on a protected route', () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      expect(guard.handleRequest(null, user, null, buildContext())).toBe(user);
    });

    it('should throw UnauthorizedException without a user on a protected route', () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      expect(() => {
        guard.handleRequest(null, false, null, buildContext());
      }).toThrow(UnauthorizedException);
    });

    it('should rethrow the original error on a protected route', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const error = new Error('jwt malformed');

      expect(() => {
        guard.handleRequest(error, null, null, buildContext());
      }).toThrow(error);
    });

    it('should return null instead of failing on a public route', () => {
      reflector.getAllAndOverride.mockReturnValue(true);

      expect(
        guard.handleRequest(new Error('expired'), false, null, buildContext()),
      ).toBeNull();
    });
  });
});
