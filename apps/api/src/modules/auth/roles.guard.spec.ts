import { RolesGuard } from "./roles.guard.js";
import { Reflector } from "@nestjs/core";
import { ExecutionContext } from "@nestjs/common";
import { ROLES_KEY } from "../../common/decorators/roles.decorator.js";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  function createMockContext(user?: { role: string }): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user: user ?? null }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it("should allow access when no roles are required", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
    const context = createMockContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it("should allow access when user role is in required roles", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["admin", "staff"]);
    const context = createMockContext({ role: "admin" });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("should allow access when user has any of the required roles", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["admin", "staff"]);
    const context = createMockContext({ role: "staff" });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("should deny access when user role does not match", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["admin"]);
    const context = createMockContext({ role: "staff" });

    expect(guard.canActivate(context)).toBe(false);
  });

  it("should throw TypeError when user is null and roles are required", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["admin"]);
    const context = createMockContext();

    // Error actual del guard: intenta leer user.role cuando user es null
    expect(() => guard.canActivate(context)).toThrow(TypeError);
  });
});
