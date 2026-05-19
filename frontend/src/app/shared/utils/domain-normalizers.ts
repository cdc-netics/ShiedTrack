import { Finding, FindingUpdate, Project } from '../models';

export function getEntityId(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const entity = value as { _id?: unknown; id?: unknown };
    return String(entity._id ?? entity.id ?? '');
  }
  return String(value);
}

export function normalizeEvidence<T extends Record<string, any>>(evidence: T): T {
  const filename = evidence['filename'] || evidence['originalName'] || 'archivo';
  const mimeType = evidence['mimeType'] || evidence['mimetype'] || '';

  return {
    ...evidence,
    filename,
    originalName: evidence['originalName'] || filename,
    mimeType,
    mimetype: evidence['mimetype'] || mimeType
  } as T;
}

export function getEvidenceMimeType(evidence?: Record<string, any> | null): string {
  return evidence?.['mimeType'] || evidence?.['mimetype'] || '';
}

export function getEvidenceName(evidence?: Record<string, any> | null): string {
  return evidence?.['originalName'] || evidence?.['filename'] || 'archivo';
}

export function normalizeFindingUpdate<T extends Record<string, any>>(update: T): T & FindingUpdate {
  const evidenceIds = Array.isArray(update['evidenceIds'])
    ? update['evidenceIds'].map((evidence: any) =>
        typeof evidence === 'object' && evidence !== null
          ? normalizeEvidence(evidence)
          : evidence
      )
    : [];

  return {
    ...update,
    _id: update['_id'] || `local-${Date.now()}`,
    type: update['type'] || 'COMMENT',
    content: update['content'] || '',
    evidenceIds,
    createdAt: update['createdAt'] || new Date().toISOString()
  } as T & FindingUpdate;
}

export function normalizeFinding<T extends Partial<Finding> & Record<string, any>>(finding: T): T & Finding {
  return {
    ...finding,
    tags: Array.isArray(finding.tags) ? finding.tags : [],
    controls: Array.isArray(finding['controls']) ? finding['controls'] : [],
    references: Array.isArray(finding['references']) ? finding['references'] : []
  } as T & Finding;
}

export function normalizeProject<T extends Partial<Project> & Record<string, any>>(project: T): T & Project {
  const clientId = project.clientId || project['client'];
  const tenantId = project.tenantId || clientId;

  return {
    ...project,
    clientId,
    tenantId,
    areaIds: Array.isArray(project.areaIds)
      ? project.areaIds
      : project.areaId
        ? [project.areaId]
        : [],
    projectStatus: project.projectStatus || 'ACTIVE',
    serviceArchitecture: project.serviceArchitecture || 'WEB'
  } as T & Project;
}
