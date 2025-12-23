import { UserRole } from '../enums';

/**
 * Interfaces de modelos del dominio
 */

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  clientId?: string;
  areaIds?: string[];
  mfaEnabled: boolean;
  isActive: boolean;
  lastLogin?: Date;
}

export interface Client {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Area {
  _id: string;
  name: string;
  description?: string;
  clientId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  clientId: string | Client;
  areaId: string | Area;
  serviceArchitecture: string;
  projectStatus: string;
  retestPolicy: {
    enabled: boolean;
    nextRetestAt?: Date;
    notify?: {
      recipients: string[];
      offsetDays: number[];
    };
  };
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
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
  closedAt?: Date;
  closedBy?: string | User;
  affectedAsset?: string;
  cvssScore?: number;
  cweId?: string;
  tags: string[];
  assignedTo?: string | User;
  createdBy: string | User;
  createdAt: Date;
  updatedAt: Date;
}

export interface FindingUpdate {
  _id: string;
  findingId: string;
  type: string;
  content: string;
  createdBy: string | User;
  previousStatus?: string;
  newStatus?: string;
  evidenceIds: string[];
  createdAt: Date;
}

export interface Evidence {
  _id: string;
  filename: string;
  storedFilename: string;
  filePath: string;
  mimeType: string;
  size: number;
  findingId: string;
  updateId?: string;
  uploadedBy: string | User;
  description?: string;
  createdAt: Date;
}
