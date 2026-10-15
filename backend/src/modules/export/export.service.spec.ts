import { ExportService } from './export.service';
import { UserRole } from '../../common/enums';
import { Types } from 'mongoose';
import { ForbiddenException } from '@nestjs/common';
import { PdfService } from '../../common/services/pdf.service';

function query(value: any) {
  const q: any = { then: (resolve: any, reject: any) => Promise.resolve(value).then(resolve, reject) };
  for (const method of ['setOptions', 'lean', 'populate', 'sort', 'select']) q[method] = jest.fn(() => q);
  return q;
}

describe('Exportaciones sin tenant activo', () => {
  const clientId = new Types.ObjectId();
  const user = { role: UserRole.PENTESTER };
  let clientQuery: any;
  let projectQuery: any;
  let evidenceQuery: any;
  let pdf: any;
  let service: ExportService;
  beforeEach(() => {
    clientQuery = query({ _id: clientId, name: 'Cliente QA' });
    projectQuery = query([]);
    evidenceQuery = query([]);
    pdf = { generateFindingReport: jest.fn().mockResolvedValue(Buffer.from('%PDF')) };
    service = new ExportService(
      { findById: () => query({ _id: new Types.ObjectId(), projectId: new Types.ObjectId(), references: ['CSV reference'] }) } as any,
      { find: () => projectQuery, findById: () => query({ tenantId: clientId }) } as any,
      { findById: () => clientQuery } as any,
      { find: () => evidenceQuery } as any,
      pdf,
    );
  });
  it('exporta CSV de cliente sin contexto de tenant', async () => {
    expect(await service.exportClientPortfolioCSV(clientId.toString(), user)).toContain('Proyecto');
    expect(clientQuery.setOptions).toHaveBeenCalledWith({ skipTenantFilter: true });
  });
  it('exporta ZIP de cliente sin contexto de tenant', async () => {
    const stream = await service.exportClientPortfolio(clientId.toString(), user);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk);
    expect(Buffer.concat(chunks).readUInt32LE(0)).toBe(0x06054b50);
    expect(clientQuery.setOptions).toHaveBeenCalledWith({ skipTenantFilter: true });
  });
  it('genera PDF con referencias de CSV y sin tenant activo', async () => {
    await expect(service.exportFindingPdf(new Types.ObjectId().toString(), user)).resolves.toEqual(Buffer.from('%PDF'));
    expect(evidenceQuery.setOptions).toHaveBeenCalledWith({ skipTenantFilter: true });
    expect(pdf.generateFindingReport).toHaveBeenCalled();
  });
  it('genera un PDF real con listas importadas por CSV', async () => {
    const buffer = await new PdfService().generateFindingReport({ title: 'Importado CSV', severity: 'HIGH', status: 'OPEN', references: ['https://example.com'], controls: ['CIS'], tags: ['csv'] });
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
  it('rechaza exportaciones de otro cliente para CLIENT_ADMIN', async () => {
    const admin = { role: UserRole.CLIENT_ADMIN, clientId: new Types.ObjectId().toString() };
    await expect(service.exportClientPortfolioCSV(clientId.toString(), admin)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.exportClientPortfolio(clientId.toString(), admin)).rejects.toBeInstanceOf(ForbiddenException);
    expect(clientQuery.setOptions).not.toHaveBeenCalled();
  });
});

describe('Descargas del auditor', () => {
  const clientId = new Types.ObjectId();
  const projectId = new Types.ObjectId();
  const project = { _id: projectId, tenantId: clientId, name: 'Proyecto', code: 'P-1', clientId: { _id: clientId, name: 'Cliente' }, areaIds: [] };
  const user = { role: UserRole.AUDITOR, auditorVisibilityScope: 'PER_CLIENT', visibleClientIds: [clientId] };
  let service: ExportService;
  let findings: any;
  beforeEach(() => {
    findings = { find: jest.fn(() => query([])), findById: () => query({ _id: new Types.ObjectId(), projectId }) };
    service = new ExportService(findings, { findById: () => query(project) } as any, {} as any,
      { find: () => query([]) } as any,
      { generateProjectReport: jest.fn().mockResolvedValue(Buffer.from('%PDF')), generateFindingReport: jest.fn().mockResolvedValue(Buffer.from('%PDF')) } as any);
  });
  async function consume(stream: any) {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
  }
  it('permite PDF de proyecto y hallazgo del cliente asignado', async () => {
    await expect(service.exportProjectPdf(projectId.toString(), user)).resolves.toEqual(Buffer.from('%PDF'));
    await expect(service.exportFindingPdf(projectId.toString(), user)).resolves.toEqual(Buffer.from('%PDF'));
  });
  it('permite Excel y ZIP del proyecto asignado', async () => {
    expect((await consume(await service.exportProjectToExcel(projectId.toString(), user))).subarray(0, 2).toString()).toBe('PK');
    expect((await consume(await service.exportProjectAsZip(projectId.toString(), user))).subarray(0, 2).toString()).toBe('PK');
  });
  it.each(['exportProjectPdf', 'exportProjectToExcel', 'exportProjectAsZip', 'exportFindingPdf'] as const)('rechaza otro cliente en %s antes de consultar hallazgos', async method => {
    await expect(service[method](projectId.toString(), { ...user, visibleClientIds: [new Types.ObjectId()] })).rejects.toBeInstanceOf(ForbiddenException);
    expect(findings.find).not.toHaveBeenCalled();
  });
  it('rechaza un proyecto fuera de la lista visible', async () => {
    await expect(service.exportProjectPdf(projectId.toString(), { ...user, visibleProjectIds: [new Types.ObjectId()] })).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('rechaza auditor sin asignaciones y permite tenant asociado', async () => {
    await expect(service.exportProjectPdf(projectId.toString(), { role: UserRole.AUDITOR })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.exportProjectPdf(projectId.toString(), { role: UserRole.AUDITOR, clientId })).resolves.toEqual(Buffer.from('%PDF'));
  });
});
import { ExportController } from './export.controller';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Reflector } from '@nestjs/core';

describe('Permisos de rutas del auditor', () => {
  const guard = new RolesGuard(new Reflector());
  function context(method: keyof ExportController): any {
    return { getHandler: () => ExportController.prototype[method], getClass: () => ExportController,
      switchToHttp: () => ({ getRequest: () => ({ user: { role: UserRole.AUDITOR } }) }) };
  }
  it.each(['exportProjectExcel', 'exportProjectZip', 'exportFindingPdf', 'exportProjectPdf'] as const)('autoriza %s', method => {
    expect(guard.canActivate(context(method))).toBe(true);
  });
  it.each(['exportFullBackup', 'createSystemBackup'] as const)('rechaza %s', method => {
    expect(() => guard.canActivate(context(method))).toThrow(ForbiddenException);
  });
});
