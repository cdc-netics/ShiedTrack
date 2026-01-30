/**
 * Enumeraciones compartidas entre frontend y backend
 * Deben coincidir con las definidas en el backend
 */

export enum UserRole {
  OWNER = 'OWNER',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  CLIENT_ADMIN = 'CLIENT_ADMIN',
  AREA_ADMIN = 'AREA_ADMIN',
  ANALYST = 'ANALYST',
  VIEWER = 'VIEWER',
}

export enum ServiceArchitecture {
  CLOUD = 'CLOUD',
  WEB = 'WEB',
  FTP = 'FTP',
  API = 'API',
  ONPREM = 'ONPREM',
  HYBRID = 'HYBRID',
  OTHER = 'OTHER',
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export enum FindingSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFORMATIONAL = 'INFORMATIONAL',
}

export enum FindingStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_RETEST = 'PENDING_RETEST',
  CLOSED = 'CLOSED',
}

export enum CloseReason {
  FIXED = 'FIXED',
  RISK_ACCEPTED = 'RISK_ACCEPTED',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  CONTRACT_ENDED = 'CONTRACT_ENDED',
  OUT_OF_SCOPE = 'OUT_OF_SCOPE',
  DUPLICATE = 'DUPLICATE',
}

export enum FindingUpdateType {
  FOLLOWUP = 'FOLLOWUP',
  TECHNICAL = 'TECHNICAL',
  STATUS_CHANGE = 'STATUS_CHANGE',
  COMMENT = 'COMMENT',
}
