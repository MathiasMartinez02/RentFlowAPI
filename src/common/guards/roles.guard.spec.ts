import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums/role.enum';

function buildContext(user: { role?: Role } | undefined): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when the route has no @Roles() metadata', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(buildContext({ role: Role.INQUILINO }))).toBe(true);
  });

  it('always allows SUPER_ADMIN regardless of the required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.FINANZAS]);

    expect(guard.canActivate(buildContext({ role: Role.SUPER_ADMIN }))).toBe(true);
  });

  it('allows access when the user role is in the required roles list', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.FINANZAS, Role.ADMIN]);

    expect(guard.canActivate(buildContext({ role: Role.FINANZAS }))).toBe(true);
  });

  it('denies access when the user role is not in the required roles list', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.FINANZAS]);

    expect(guard.canActivate(buildContext({ role: Role.INQUILINO }))).toBe(false);
  });

  it('denies access when there is no authenticated user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.FINANZAS]);

    expect(guard.canActivate(buildContext(undefined))).toBe(false);
  });
});
