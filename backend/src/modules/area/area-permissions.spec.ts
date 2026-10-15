import { AreaController } from './area.controller';
import { AreaService } from './area.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../common/enums';
import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { canRolePerform } from '../../common/rbac/rbac-policy';

function query(value: any) {
  const q: any = { then: (resolve: any, reject: any) => Promise.resolve(value).then(resolve, reject) };
  for (const method of ['setOptions', 'where', 'populate']) q[method] = jest.fn(() => q);
  return q;
}

describe('Gestión de áreas por pentester', () => {
  const guard = new RolesGuard(new Reflector());
  const methods = ['create', 'update', 'deactivate', 'hardDelete'] as const;
  function context(method: typeof methods[number], role: UserRole): any {
    return { getHandler: () => AreaController.prototype[method], getClass: () => AreaController,
      switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }) };
  }
  it.each(methods)('autoriza %s para pentester y rechaza auditor', method => {
    expect(guard.canActivate(context(method, UserRole.PENTESTER))).toBe(true);
    expect(() => guard.canActivate(context(method, UserRole.AUDITOR))).toThrow(ForbiddenException);
  });
  it('refleja el CRUD completo en la matriz RBAC', () => {
    for (const action of ['create', 'read', 'update', 'delete'] as const) {
      expect(canRolePerform(UserRole.PENTESTER, 'areas', action)).toBe(true);
      expect(canRolePerform(UserRole.AUDITOR, 'areas', action)).toBe(false);
    }
  });
  it.each(['findById', 'update', 'deactivate', 'hardDelete'] as const)('%s funciona sin tenant fijo', async method => {
    const q = query({ name: 'Área', _id: new Types.ObjectId() });
    const model: any = { findById: () => q, findByIdAndUpdate: () => q, findByIdAndDelete: () => q };
    const service = new AreaService(model);
    const user = { role: UserRole.PENTESTER };
    if (method === 'update') await service.update(new Types.ObjectId().toString(), { name: 'Actualizada' }, user);
    else await service[method](new Types.ObjectId().toString(), user);
    expect(q.setOptions).toHaveBeenCalledWith({ skipTenantFilter: true });
  });
  it('restringe la edición al cliente del pentester con tenant fijo', async () => {
    const q = query({ name: 'Área' });
    const tenantId = new Types.ObjectId();
    await new AreaService({ findByIdAndUpdate: () => q } as any).update(new Types.ObjectId().toString(), { name: 'Actualizada' }, { role: UserRole.PENTESTER, clientId: tenantId });
    expect(q.where).toHaveBeenCalledWith({ tenantId });
  });
});
