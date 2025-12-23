import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../common/enums';

/**
 * Decorator para definir roles permitidos en un endpoint
 * Usado en conjunto con RolesGuard
 * 
 * @example
 * @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN)
 * async deleteClient() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
