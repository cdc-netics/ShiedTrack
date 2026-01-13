/**
 * Enumeración de roles del sistema (RBAC)
 * Define la jerarquía de permisos en ShieldTrack
 */
export enum UserRole {
  /** Propietario del sistema - Único con permiso de hard delete */
  OWNER = 'OWNER',
  
  /** Administrador de plataforma - Acceso completo excepto hard delete */
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  
  /** Administrador de cliente - Gestiona su tenant */
  CLIENT_ADMIN = 'CLIENT_ADMIN',
  
  /** Administrador de área - Gestiona su área específica */
  AREA_ADMIN = 'AREA_ADMIN',
  
  /** Analista SOC - Crea hallazgos, updates y sube evidencias */
  ANALYST = 'ANALYST',
  
  /** Visualizador - Solo lectura */
  VIEWER = 'VIEWER',
}

/**
 * Arquitectura de servicio de un proyecto
 */
export enum ServiceArchitecture {
  CLOUD = 'CLOUD',
  WEB = 'WEB',
  FTP = 'FTP',
  API = 'API',
  ONPREM = 'ONPREM',
  HYBRID = 'HYBRID',
  MOBILE = 'MOBILE',
  DESKTOP = 'DESKTOP',
  IOT = 'IOT',
  BLOCKCHAIN = 'BLOCKCHAIN',
  MICROSERVICES = 'MICROSERVICES',
  SERVERLESS = 'SERVERLESS',
  CONTAINER = 'CONTAINER',
  MAINFRAME = 'MAINFRAME',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  OTHER = 'OTHER',
}

/**
 * Estados posibles de un proyecto
 */
export enum ProjectStatus {
  /** Proyecto activo */
  ACTIVE = 'ACTIVE',
  
  /** Proyecto cerrado - Detiene hallazgos y notificaciones */
  CLOSED = 'CLOSED',
  
  /** Proyecto archivado - Solo consulta histórica */
  ARCHIVED = 'ARCHIVED',
}

/**
 * Severidad de un hallazgo
 */
export enum FindingSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFORMATIONAL = 'INFORMATIONAL',
}

/**
 * Estados del ciclo de vida de un hallazgo
 * ALINEADO CON PROMPT.TXT - Sección 3
 */
export enum FindingStatus {
  /** Hallazgo abierto - Pendiente de atención */
  OPEN = 'OPEN',
  
  /** En proceso de remediación */
  IN_PROGRESS = 'IN_PROGRESS',
  
  /** Requiere retest - Validación pendiente */
  RETEST_REQUIRED = 'RETEST_REQUIRED',
  
  /** Retest exitoso - Vulnerabilidad corregida */
  RETEST_PASSED = 'RETEST_PASSED',
  
  /** Retest fallido - Vulnerabilidad persiste */
  RETEST_FAILED = 'RETEST_FAILED',
  
  /** Hallazgo cerrado */
  CLOSED = 'CLOSED',
}

/**
 * Motivos de cierre de un hallazgo
 */
export enum CloseReason {
  /** Vulnerabilidad corregida */
  FIXED = 'FIXED',
  
  /** Riesgo aceptado por el cliente */
  RISK_ACCEPTED = 'RISK_ACCEPTED',
  
  /** Falso positivo */
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  
  /** Contrato finalizado */
  CONTRACT_ENDED = 'CONTRACT_ENDED',
  
  /** Fuera del alcance del proyecto */
  OUT_OF_SCOPE = 'OUT_OF_SCOPE',
  
  /** Duplicado de otro hallazgo */
  DUPLICATE = 'DUPLICATE',
}

/**
 * Tipos de actualizaciones en el timeline de hallazgo
 */
export enum FindingUpdateType {
  /** Seguimiento operativo */
  FOLLOWUP = 'FOLLOWUP',
  
  /** Actualización técnica */
  TECHNICAL = 'TECHNICAL',
  
  /** Cambio de estado */
  STATUS_CHANGE = 'STATUS_CHANGE',
  
  /** Comentario general */
  COMMENT = 'COMMENT',
}
