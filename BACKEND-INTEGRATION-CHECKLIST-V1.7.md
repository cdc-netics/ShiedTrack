# 🔧 Backend Integration Checklist - v1.7

## 📋 Endpoints Requeridos por los Nuevos Componentes

### ✅ EXISTENTES (No requieren cambios)

#### Usuario
- [x] `GET /api/auth/users` - ListarUsuarios
- [x] `DELETE /api/auth/users/{id}/soft` - Bloquear usuario
- [x] `POST /api/auth/users/{id}/reactivate` - Desbloquear usuario
- [x] `POST /api/auth/users/{id}/reset-password` - Reset password

#### Áreas
- [x] `DELETE /api/areas/{id}/hard` - Eliminar área permanentemente
- [x] Validación de eliminación: Consulta usando `deleteOne()` directo en MongoDB

---

### ⚠️ REQUIEREN IMPLEMENTACIÓN

#### 1. Asignación Centralizada de Usuarios
**Endpoint:** `POST /api/auth/users/{userId}/assignments`

**Request Body:**
```json
{
  "clientIds": ["client1", "client2"],
  "projectIds": ["proj1", "proj2"],
  "areaIds": ["area1"]
}
```

**Response:**
```json
{
  "_id": "userId",
  "firstName": "John",
  "email": "john@example.com",
  "assignments": {
    "clients": ["client1", "client2"],
    "projects": ["proj1", "proj2"],
    "areas": ["area1"]
  }
}
```

**Implementación (NestJS):**
```typescript
// user.controller.ts
@Post(':userId/assignments')
@UseGuards(AuthGuard, RbacGuard)
@CheckPermission('user:assign')
async assignToResources(
  @Param('userId') userId: string,
  @Body() assignmentDto: UserAssignmentDto
): Promise<User> {
  return this.userService.updateAssignments(userId, assignmentDto);
}

// user.service.ts
async updateAssignments(userId: string, dto: UserAssignmentDto): Promise<User> {
  // Validar que cliente/proyecto/área existen
  // Actualizar user document
  return this.userModel.findByIdAndUpdate(
    userId,
    {
      assignments: {
        clients: dto.clientIds,
        projects: dto.projectIds,
        areas: dto.areaIds
      }
    },
    { new: true }
  ).exec();
}
```

**DTO (NestJS):**
```typescript
// dto/user-assignment.dto.ts
export class UserAssignmentDto {
  @IsArray()
  @IsString({ each: true })
  clientIds: string[];

  @IsArray()
  @IsString({ each: true })
  projectIds: string[];

  @IsArray()
  @IsString({ each: true })
  areaIds: string[];
}
```

**User Schema - Agregar campo:**
```typescript
// schemas/user.schema.ts
@Schema()
export class User {
  // ... campos existentes

  @Prop({
    type: {
      clients: [String],
      projects: [String],
      areas: [String]
    },
    default: { clients: [], projects: [], areas: [] }
  })
  assignments: {
    clients: string[];
    projects: string[];
    areas: string[];
  };
}
```

---

#### 2. Configuración de Branding de Tenant
**Endpoint:** `POST /api/clients/me/branding`

**Request Type:** `multipart/form-data`

**Request Body:**
```
- name: text (string)
- displayName: text (string)
- primaryColor: text (string, color hex)
- favicon: file (image/*)
- logo: file (image/*)
```

**Response:**
```json
{
  "_id": "clientId",
  "name": "ACME Corporation",
  "displayName": "ACME",
  "primaryColor": "#1976D2",
  "favicon": "data:image/png;base64,...",
  "logo": "data:image/png;base64,...",
  "updatedAt": "2025-01-14T10:00:00Z"
}
```

**Implementación (NestJS):**
```typescript
// client.controller.ts
@Post('me/branding')
@UseGuards(AuthGuard)
@UseInterceptors(FileFieldsInterceptor([
  { name: 'favicon', maxCount: 1 },
  { name: 'logo', maxCount: 1 }
]))
async updateBranding(
  @GetUser() user: User,
  @Body() brandingDto: ClientBrandingDto,
  @UploadedFiles() files: { favicon?: Express.Multer.File[], logo?: Express.Multer.File[] }
): Promise<Client> {
  return this.clientService.updateBranding(user.clientId, brandingDto, files);
}

// client.service.ts
async updateBranding(
  clientId: string,
  dto: ClientBrandingDto,
  files: any
): Promise<Client> {
  const updateData = {
    name: dto.name,
    displayName: dto.displayName,
    primaryColor: dto.primaryColor
  };

  // Procesar favicon si existe
  if (files?.favicon?.[0]) {
    const base64 = files.favicon[0].buffer.toString('base64');
    updateData['favicon'] = `data:${files.favicon[0].mimetype};base64,${base64}`;
  }

  // Procesar logo si existe
  if (files?.logo?.[0]) {
    const base64 = files.logo[0].buffer.toString('base64');
    updateData['logo'] = `data:${files.logo[0].mimetype};base64,${base64}`;
  }

  return this.clientModel.findByIdAndUpdate(clientId, updateData, { new: true }).exec();
}
```

**DTO:**
```typescript
// dto/client-branding.dto.ts
export class ClientBrandingDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsString()
  @Matches(/^#[0-9A-F]{6}$/i, { message: 'Color debe ser válido hex' })
  primaryColor: string;
}
```

**Client Schema - Agregar campos:**
```typescript
// schemas/client.schema.ts
@Schema()
export class Client {
  // ... campos existentes

  @Prop({ type: String, required: true })
  displayName: string;

  @Prop({ type: String })
  favicon: string; // base64 encoded

  @Prop({ type: String })
  logo: string; // base64 encoded

  @Prop({ type: String })
  primaryColor: string; // hex color

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}
```

---

#### 3. Descargas de Hallazgos (Endpoints)
**Endpoints:**

**3.1 CSV Export:**
```http
GET /api/findings/{id}/export/csv
Response: Blob (text/csv)
```

**Implementación:**
```typescript
// finding.controller.ts
@Get(':id/export/csv')
@UseGuards(AuthGuard)
async exportCSV(
  @Param('id') findingId: string,
  @GetUser() user: User
): Promise<StreamableFile> {
  const csv = await this.findingService.generateCSV(findingId, user);
  return new StreamableFile(Buffer.from(csv), {
    type: 'text/csv; charset=utf-8',
    disposition: `attachment; filename="finding-${findingId}.csv"`,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="finding-${findingId}.csv"`
    }
  });
}

// finding.service.ts
async generateCSV(findingId: string, user: User): Promise<string> {
  const finding = await this.findingModel.findById(findingId)
    .populate('clientId projectId');

  if (!finding) throw new NotFoundException('Finding not found');

  // Verificar permiso
  if (finding.clientId._id.toString() !== user.clientId) {
    throw new ForbiddenException('Acceso denegado');
  }

  // Generar CSV
  const bom = '\uFEFF'; // UTF-8 BOM para Excel
  const csv = [
    ['ID', 'Título', 'Descripción', 'Severidad', 'Estado', 'Cliente', 'Proyecto', 'Fecha'],
    [
      finding._id.toString(),
      finding.title,
      finding.description,
      finding.severity,
      finding.status,
      finding.clientId.name,
      finding.projectId.name,
      finding.createdAt.toISOString()
    ]
  ]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return bom + csv;
}
```

**3.2 PDF Export (Opcional):**
```http
GET /api/findings/{id}/export/pdf
Response: Blob (application/pdf)
```

**Implementación (requiere pdfkit o similar):**
```typescript
// finding.controller.ts
@Get(':id/export/pdf')
@UseGuards(AuthGuard)
async exportPDF(
  @Param('id') findingId: string,
  @GetUser() user: User
): Promise<StreamableFile> {
  const pdf = await this.findingService.generatePDF(findingId, user);
  return new StreamableFile(pdf, {
    type: 'application/pdf',
    disposition: `attachment; filename="finding-${findingId}.pdf"`
  });
}

// finding.service.ts
async generatePDF(findingId: string, user: User): Promise<Buffer> {
  const finding = await this.findingModel.findById(findingId)
    .populate('clientId projectId');

  if (!finding) throw new NotFoundException('Finding not found');

  // Verificar permiso
  if (finding.clientId._id.toString() !== user.clientId) {
    throw new ForbiddenException('Acceso denegado');
  }

  // Usar pdfkit o similar para generar PDF
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument();
  
  doc.fontSize(20).text(`Hallazgo: ${finding.title}`);
  doc.fontSize(12);
  doc.text(`ID: ${finding._id}`);
  doc.text(`Severidad: ${finding.severity}`);
  doc.text(`Estado: ${finding.status}`);
  doc.text(`Cliente: ${finding.clientId.name}`);
  doc.text(`Proyecto: ${finding.projectId.name}`);
  doc.text(`Descripción:\n${finding.description}`);
  
  return doc.finalize();
}
```

---

### 🔍 VERIFICACIÓN

#### Endpoints Ya Existentes (Solo Verificar)

**1. Usuario - Verificar que existen:**
```bash
# Listar usuarios
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/auth/users

# Bloquear
curl -X DELETE -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/auth/users/{userId}/soft

# Desbloquear
curl -X POST -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/auth/users/{userId}/reactivate

# Reset password
curl -X POST -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/auth/users/{userId}/reset-password
```

**2. Área - Verificar eliminación:**
```bash
curl -X DELETE -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/areas/{areaId}/hard
```

---

## 📝 DTO Classes Faltantes

### UserAssignmentDto
```typescript
// src/modules/auth/dto/user-assignment.dto.ts

import { IsArray, IsString, IsOptional } from 'class-validator';

export class UserAssignmentDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  clientIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  projectIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  areaIds?: string[];
}
```

### ClientBrandingDto
```typescript
// src/modules/client/dto/client-branding.dto.ts

import { IsString, Matches, IsOptional } from 'class-validator';

export class ClientBrandingDto {
  @IsString()
  name: string;

  @IsString()
  displayName: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-F]{6}$/i, { message: 'primaryColor debe ser un color hex válido' })
  primaryColor?: string;
}
```

---

## 📊 Schema Updates

### User Schema - Agregar
```typescript
assignments: {
  clients: string[];
  projects: string[];
  areas: string[];
}
```

### Client Schema - Agregar
```typescript
displayName: string;
favicon: string; // base64
logo: string; // base64
primaryColor: string; // hex
updatedAt: Date;
```

---

## ✅ Testing Checklist

- [ ] Endpoint `POST /api/auth/users/{userId}/assignments` funciona
  - [ ] Guarda clientIds, projectIds, areaIds
  - [ ] Valida que recursos existen
  - [ ] Verifica permisos del usuario

- [ ] Endpoint `POST /api/clients/me/branding` funciona
  - [ ] Acepta multipart/form-data
  - [ ] Guarda favicon y logo (base64)
  - [ ] Guarda displayName y primaryColor
  - [ ] Solo propietario del cliente puede actualizar

- [ ] Endpoint `GET /api/findings/{id}/export/csv` funciona
  - [ ] Retorna CSV con UTF-8 BOM
  - [ ] Verifica permiso del usuario
  - [ ] Columnas: ID, Título, Descripción, Severidad, Estado, Cliente, Proyecto, Fecha

- [ ] Endpoint `GET /api/findings/{id}/export/pdf` funciona (opcional)
  - [ ] Retorna PDF valido
  - [ ] Verifica permiso del usuario

---

## 🚀 Deployment

Una vez implementados todos los endpoints:

1. Compilar backend: `npm run build`
2. Iniciar backend: `node dist/main.js`
3. Verificar logs: Sin errores de ruta no encontrada
4. Frontend compilará automáticamente (watch mode)
5. Probar en navegador: `http://localhost:4200`

---

**Estado:** Todos los componentes FRONTEND están implementados.
**Falta:** Implementar endpoints backend señalados arriba.

