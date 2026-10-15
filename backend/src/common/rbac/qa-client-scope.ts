import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../enums';

/** Restricción exclusiva de QA con cliente fijo; no modifica los demás roles. */
export function assignedQaClientId(user?: any): string | undefined {
  if (user?.role !== UserRole.QA) return undefined;
  const client = user.clientId || user.activeTenantId;
  return client ? (client._id || client).toString() : undefined;
}

export function assertQaClientAccess(user: any, targetClientId?: any): void {
  const assigned = assignedQaClientId(user);
  if (assigned && assigned !== targetClientId?.toString()) {
    throw new ForbiddenException('QA solo puede registrar proyectos y hallazgos para su cliente asignado');
  }
}
