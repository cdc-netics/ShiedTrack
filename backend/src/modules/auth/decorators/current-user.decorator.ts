import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator para obtener el usuario autenticado actual
 * Extrae los datos del usuario del request (inyectados por JwtStrategy)
 * 
 * @example
 * async createFinding(@CurrentUser() user: any) {
 *   console.log(user.userId, user.email, user.role);
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
