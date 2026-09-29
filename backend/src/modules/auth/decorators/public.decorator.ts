import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/**
 * Decorator para marcar un endpoint como público (sin JWT), incluso
 * dentro de un controller con guard aplicado a nivel de clase.
 * Usado en conjunto con JwtAuthGuard.
 *
 * @example
 * @Public()
 * @Get("branding")
 * async getBranding() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
