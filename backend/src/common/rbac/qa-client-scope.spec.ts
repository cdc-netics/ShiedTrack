import { assignedQaClientId, assertQaClientAccess } from './qa-client-scope';
import { UserRole, ServiceArchitecture } from '../enums';
import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ProjectService } from '../../modules/project/project.service';
import { FindingService } from '../../modules/finding/finding.service';

const assigned = new Types.ObjectId();
const foreign = new Types.ObjectId();
const qa = { role: UserRole.QA, clientId: assigned, activeTenantId: assigned };
function query(value: any) {
  const q: any = { then: (resolve: any, reject: any) => Promise.resolve(value).then(resolve, reject) };
  for (const method of ['setOptions', 'populate', 'lean', 'select']) q[method] = jest.fn(() => q);
  return q;
}

describe('QA asignado: creación limitada a su cliente', () => {
  it('prioriza cliente asignado frente a otro contexto activo', () => {
    expect(assignedQaClientId({ ...qa, activeTenantId: foreign })).toBe(assigned.toString());
    expect(() => assertQaClientAccess({ ...qa, activeTenantId: foreign }, foreign)).toThrow(ForbiddenException);
  });
  it.each(['clientId', 'tenantId'])('rechaza proyecto con %s de otro cliente antes de escribir', async field => {
    const model: any = jest.fn();
    await expect(new ProjectService(model, {} as any).create({ name: 'Proyecto', code: 'P', serviceArchitecture: ServiceArchitecture.WEB, [field]: foreign.toString() } as any, qa)).rejects.toBeInstanceOf(ForbiddenException);
    expect(model).not.toHaveBeenCalled();
  });
  it.each([UserRole.QA, UserRole.PENTESTER, UserRole.OWNER])('conserva creación permitida para %s', async role => {
    const model: any = jest.fn().mockImplementation(data => ({ ...data, save: jest.fn().mockResolvedValue(undefined) }));
    const client = role === UserRole.QA ? assigned : foreign;
    const project = await new ProjectService(model, {} as any).create({ name: 'Proyecto', code: 'P', serviceArchitecture: ServiceArchitecture.WEB, clientId: client.toString(), tenantId: client.toString() } as any, { ...qa, role });
    expect(project.tenantId).toEqual(client);
  });
  it('QA sin cliente fijo conserva creación transversal', () => {
    expect(() => assertQaClientAccess({ role: UserRole.QA }, foreign)).not.toThrow();
  });
  it.each([assigned, foreign])('valida cliente del proyecto al crear hallazgo (%s)', async tenantId => {
    const model: any = jest.fn().mockImplementation(data => ({ ...data, save: jest.fn().mockResolvedValue(undefined) }));
    const service = new FindingService(model, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
    jest.spyOn(service as any, 'findProjectOrFailWithAccess').mockResolvedValue({ tenantId });
    jest.spyOn(service as any, 'sendFindingCreatedNotification').mockResolvedValue(undefined);
    const request = service.create({ projectId: new Types.ObjectId().toString(), title: 'Hallazgo' } as any, new Types.ObjectId().toString(), qa);
    if (tenantId === foreign) {
      await expect(request).rejects.toBeInstanceOf(ForbiddenException);
      expect(model).not.toHaveBeenCalled();
    } else {
      expect((await request).tenantId).toEqual(assigned);
    }
  });
  it.each([true, false])('rechaza CSV de otro cliente sin crear entidades (dryRun=%s)', async dryRun => {
    const model: any = jest.fn();
    const clients: any = { findById: () => query({ _id: assigned, name: 'PJUD' }) };
    const service = new FindingService(model, {} as any, {} as any, {} as any, {} as any, {} as any, clients, {} as any);
    jest.spyOn(service as any, 'parseCsv').mockReturnValue([{ Titulo: 'Hallazgo', Descripcion: 'Detalle', 'CAT-COD-interno': 'C1', Criticidad: 'HIGH', Cliente: 'UNAB' }]);
    const result = await service.bulkImport({ originalname: 'hallazgos.csv', buffer: Buffer.from('') } as any, 'Proyecto', qa, dryRun);
    expect(result.creados).toBe(0);
    expect(result.fallidos).toBe(1);
    expect(result.errores[0].detalle).toContain('cliente asignado');
    expect(model).not.toHaveBeenCalled();
  });
});
