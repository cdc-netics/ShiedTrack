import { Schema } from 'mongoose';
import { getTenant } from '../utils/tenant-context';

/**
 * Mongoose plugin para aplicar filtro por tenantId automáticamente
 * Requiere que el request haya establecido el tenantId en AsyncLocalStorage
 */
export function tenantPlugin(schema: Schema) {
  const applyTenantFilter = function(this: any) {
    const tenantId = getTenant();
    // Solo aplicar si el schema tiene camino tenantId y hay tenant en contexto
    if (tenantId && schema.path('tenantId')) {
      const q = this.getQuery();
      // No sobreescribir si ya existe filtro explícito
      if (!('tenantId' in q)) {
        this.where({ tenantId });
      }
    }
  };

  schema.pre('find', applyTenantFilter);
  schema.pre('findOne', applyTenantFilter);
  schema.pre('countDocuments', applyTenantFilter);
  schema.pre('updateOne', applyTenantFilter);
  schema.pre('updateMany', applyTenantFilter);

  // Agregaciones: insertar $match al principio si corresponde
  schema.pre('aggregate', function(this: any) {
    const tenantId = getTenant();
    if (tenantId && schema.path('tenantId')) {
      const pipeline = this.pipeline();
      const hasMatch = pipeline.find((stage: any) => stage.$match && stage.$match.tenantId);
      if (!hasMatch) {
        pipeline.unshift({ $match: { tenantId } });
      }
    }
  });
}