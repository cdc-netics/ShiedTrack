import { Types } from 'mongoose';
import { AuthService } from '../auth/auth.service';
import { UserAssignmentService } from '../auth/user-assignment.service';
import { AreaService } from '../area/area.service';
import { ExportService } from './export.service';
import { UserRole } from '../../common/enums';
import { BadRequestException } from '@nestjs/common';

function query(value: any) {
  const q: any = { then: (resolve: any, reject: any) => Promise.resolve(value).then(resolve, reject) };
  for (const method of ['setOptions', 'lean', 'populate', 'sort', 'select', 'exec']) q[method] = jest.fn(() => q);
  return q;
}

describe('Regresiones QA', () => {
  const oldClient = new Types.ObjectId();
  const newClient = new Types.ObjectId();
  const userId = new Types.ObjectId().toString();
  it('reasigna también el tenant activo y limpia restricciones del cliente anterior', async () => {
    const model: any = { findById: () => query({ clientId: oldClient }), findByIdAndUpdate: jest.fn(() => query({ email: 'test@example.com' })) };
    const areas: any = { replaceUserAreas: jest.fn().mockResolvedValue([]) };
    const service = new AuthService(model, {} as any, areas, {} as any);
    await service.updateUser(userId, { clientId: newClient.toString() }, { role: UserRole.OWNER, userId });
    const data = model.findByIdAndUpdate.mock.calls[0][1];
    expect(data.activeTenantId).toEqual(newClient);
    expect(data.tenantIds).toEqual([newClient]);
    expect(data.visibleProjectIds).toEqual([]);
    expect(areas.replaceUserAreas).toHaveBeenCalledWith(userId, [], userId);
  });
  it('persiste asignación de cliente aunque el cliente no tenga áreas', async () => {
    const users: any = { findById: () => query({}), findByIdAndUpdate: jest.fn(() => query({})) };
    const assignments: any = { updateMany: () => query({}) };
    const service = new UserAssignmentService(assignments, users, { find: () => query([]) } as any, {} as any,
      { find: () => query([{ _id: newClient, name: 'UNAB' }]) } as any);
    await service.updateAssignments(userId, { clientIds: [newClient.toString()], projectIds: [], areaIds: [] }, userId);
    expect(users.findByIdAndUpdate).toHaveBeenLastCalledWith(userId, { $set: expect.objectContaining({ clientId: newClient, activeTenantId: newClient, tenantIds: [newClient] }) });
  });
  it.each([UserRole.OWNER, UserRole.ADMIN_AREA, UserRole.PENTESTER, UserRole.AUDITOR])('incluye los 17 hallazgos en PDF para %s', async role => {
    const projectId = new Types.ObjectId();
    const findings = Array.from({ length: 17 }, (_, i) => ({ code: `VULN-${i}`, title: `Hallazgo ${i}`, status: 'OPEN', severity: 'HIGH' }));
    const model: any = { find: jest.fn((filter: any) => query(filter.projectId instanceof Types.ObjectId ? findings : [])) };
    const pdf: any = { generateProjectReport: jest.fn().mockResolvedValue(Buffer.from('%PDF')) };
    const service = new ExportService(model, { findById: () => query({ _id: projectId, tenantId: newClient }) } as any, {} as any, {} as any, pdf);
    await service.exportProjectPdf(projectId.toString(), { role, clientId: newClient });
    expect(pdf.generateProjectReport).toHaveBeenCalledWith(expect.anything(), findings);
  });
  it('lista áreas de ADMIN_AREA sin tenant fijo sin fallar el plugin', async () => {
    const q = query([]);
    const service = new AreaService({ find: () => q } as any);
    await expect(service.findByClient(undefined, false, { role: UserRole.ADMIN_AREA })).resolves.toEqual([]);
    expect(q.setOptions).toHaveBeenCalledWith({ skipTenantFilter: true });
  });
  it('crea área con el cliente explícito sin depender del contexto CLS', async () => {
    const q = query(null);
    const model: any = jest.fn().mockImplementation(data => ({ ...data, save: jest.fn().mockResolvedValue(undefined) }));
    model.findOne = jest.fn(() => q);
    const area = await new AreaService(model).create({ name: 'Seguridad', tenantId: newClient.toString() }, { role: UserRole.ADMIN_AREA });
    expect(area.tenantId).toEqual(newClient);
    expect(model.findOne).toHaveBeenCalledWith({ tenantId: newClient });
    expect(q.setOptions).toHaveBeenCalledWith({ skipTenantFilter: true });
  });
  it('rechaza crear área en otro cliente para un administrador con tenant', async () => {
    await expect(new AreaService({} as any).create({ name: 'Seguridad', tenantId: newClient.toString() }, { role: UserRole.ADMIN_AREA, clientId: oldClient })).rejects.toBeInstanceOf(BadRequestException);
  });
});
import { ProjectController } from '../project/project.controller';
import { ClientController } from '../client/client.controller';
import { AuthController } from '../auth/auth.controller';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';

describe('Permisos de eliminación QA', () => {
  const guard = new RolesGuard(new Reflector());
  function context(controller: any, method: string, role: UserRole): any {
    return { getClass: () => controller, getHandler: () => controller.prototype[method], switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }) };
  }
  it('permite borrar proyectos y desactivar clientes al pentester', () => {
    expect(guard.canActivate(context(ProjectController, 'hardDelete', UserRole.PENTESTER))).toBe(true);
    expect(guard.canActivate(context(ClientController, 'deactivate', UserRole.PENTESTER))).toBe(true);
  });
  it('mantiene al auditor sin permisos de eliminación', () => {
    expect(() => guard.canActivate(context(ProjectController, 'hardDelete', UserRole.AUDITOR))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context(ClientController, 'deactivate', UserRole.AUDITOR))).toThrow(ForbiddenException);
  });
  it('permite eliminación lógica de auditores a ADMIN_AREA', () => {
    expect(guard.canActivate(context(AuthController, 'softDeleteUser', UserRole.ADMIN_AREA))).toBe(true);
    expect(() => guard.canActivate(context(AuthController, 'hardDeleteUser', UserRole.ADMIN_AREA))).toThrow(ForbiddenException);
  });
});
