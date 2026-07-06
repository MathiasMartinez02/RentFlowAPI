import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

function buildContext(): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({}) }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let reflector: Reflector;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('bypasses passport authentication when the route is @Public()', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const superCanActivate = jest.spyOn(
      Object.getPrototypeOf(Object.getPrototypeOf(guard)),
      'canActivate',
    );

    expect(guard.canActivate(buildContext())).toBe(true);
    expect(superCanActivate).not.toHaveBeenCalled();
  });

  describe('handleRequest', () => {
    it('returns the user when authentication succeeded', () => {
      const user = { id: 'user-1' };
      expect(guard.handleRequest(null, user)).toBe(user);
    });

    it('throws the original error when passport reports one', () => {
      const err = new Error('boom');
      expect(() => guard.handleRequest(err, null)).toThrow(err);
    });

    it('throws UnauthorizedException when there is no error but also no user', () => {
      expect(() => guard.handleRequest(null, null)).toThrow(UnauthorizedException);
    });
  });
});
