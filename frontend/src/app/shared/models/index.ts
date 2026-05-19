import { UserRole } from '../enums';

/**
 * Interfaces de modelos del dominio
 */

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: UserRole;
  clientId?: string;
  areaIds?: string[];
  mfaEnabled: boolean;
  isActive: boolean;
  isDeleted?: boolean; // Soft delete flag
  lastLogin?: Date | string;
}

export interface Client {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Area {
  _id: string;
  name: string;
  description?: string;
  clientId: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Project {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  tenantId?: string | Client;
  clientId: string | Client;
  areaId?: string | Area;
  areaIds?: Array<string | Area>;
  serviceArchitecture: string;
  projectStatus: string;
  retestPolicy: {
    enabled: boolean;
      nextRetestAt?: Date | string;
    notify?: {
      recipients: string[];
      offsetDays: number[];
    };
  };
  startDate?: Date | string;
  endDate?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Finding {
  _id: string;
  code: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  projectId: string | Project;
  retestIncluded: boolean;
  closeReason?: string;
  closedAt?: Date | string;
  closedBy?: string | User;
  affectedAsset?: string;
  cvssScore?: number;
  cweId?: string;
  tags: string[];
  assignedTo?: string | User;
  createdBy: string | User;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface FindingUpdate {
  _id: string;
  findingId: string;
  type: string;
  content: string;
  createdBy: string | User;
  previousStatus?: string;
  newStatus?: string;
  evidenceIds: Array<string | Evidence>;
  createdAt: Date | string;
}

export interface Evidence {
  _id: string;
  filename: string;
  originalName?: string;
  storedFilename: string;
  filePath: string;
  mimeType: string;
  mimetype?: string;
  size: number;
  findingId: string;
  updateId?: string;
  uploadedBy: string | User;
  description?: string;
  createdAt: Date | string;
}
