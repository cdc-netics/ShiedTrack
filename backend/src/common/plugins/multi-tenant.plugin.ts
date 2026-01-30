/**
 * Plugin de Mongoose para Multi-Tenancy
 * Aplica filtros automáticos por tenantId en TODAS las queries
 * Excepto para usuarios OWNER que pueden ver todos los tenants
 */
import { Schema, Types } from 'mongoose';
import { getNamespace } from 'cls-hooked';

export interface MultiTenantDocument {
  tenantId?: Types.ObjectId;
}

/**
 * Obtiene el tenantId del contexto actual (AsyncLocalStorage/CLS)
 */
function getCurrentTenantId(): string | undefined {
  const namespace = getNamespace('tenant-context');
  return namespace?.get('tenantId');
}

/**
 * Verifica si el usuario actual es OWNER (puede ver todos los tenants)
 */
function isOwnerRole(): boolean {
  const namespace = getNamespace('tenant-context');
  return namespace?.get('isOwner') === true;
}

/**
 * Plugin que se aplica a todos los schemas que necesitan aislamiento de tenant
 */
export function multiTenantPlugin(schema: Schema) {
  // Asegurar camino tenantId con tipo ObjectId si no existe
  if (!schema.path('tenantId')) {
    schema.add({
      tenantId: { type: Schema.Types.ObjectId, required: true, index: true }
    });
  }

  // MIDDLEWARE PRE-SAVE: Asignar tenantId automáticamente al crear
  schema.pre('save', function (next) {
    if (isOwnerRole()) {
      // Owner puede guardar sin tenantId o con el que especifique
      return next();
    }

    const tenantId = getCurrentTenantId();
    if (!this.tenantId && tenantId) {
      this.tenantId = new Types.ObjectId(tenantId);
    }

    if (!this.tenantId) {
      return next(new Error('tenantId es requerido para esta operación'));
    }

    next();
  });

  // MIDDLEWARE PRE-FIND: Filtrar por tenantId automáticamente
  const applyTenantFilter = function (this: any, next: any) {
    if (isOwnerRole()) {
      // Owner puede ver todos los tenants
      return next();
    }

    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      return next(new Error('No hay contexto de tenant activo'));
    }

    // Aplicar filtro automático
    this.where({ tenantId: new Types.ObjectId(tenantId) });
    next();
  };

  schema.pre('find', applyTenantFilter);
  schema.pre('findOne', applyTenantFilter);
  schema.pre('findOneAndUpdate', applyTenantFilter);
  schema.pre('findOneAndDelete', applyTenantFilter);
  schema.pre('findOneAndReplace', applyTenantFilter);
  schema.pre('countDocuments', applyTenantFilter);
  schema.pre('deleteMany', applyTenantFilter);
  schema.pre('updateMany', applyTenantFilter);

  // MIDDLEWARE POST-FIND: Verificación adicional de seguridad
  schema.post('find', function (docs: any[]) {
    if (isOwnerRole()) return;

    const tenantId = getCurrentTenantId();
    if (!tenantId) return;

    // Verificar que ningún documento se escape del tenant
    docs.forEach((doc: any) => {
      if (doc.tenantId && doc.tenantId.toString() !== tenantId) {
        throw new Error('Violación de aislamiento de tenant detectada');
      }
    });
  });
}
