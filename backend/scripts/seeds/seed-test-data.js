#!/usr/bin/env node

/**
 * Script de seed para tests P0 de ShieldTrack
 * Crea datos de prueba alineados con Promp.txt
 *
 * Uso:
 *   pnpm run seed:test
 *   node scripts/seeds/seed-test-data.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

const log = (msg, color = 'reset') => console.log(`${colors[color]}${msg}${colors.reset}`);
const oid = (hex) => new mongoose.Types.ObjectId(hex);

// IDs estables para que reiniciar Docker no rompa seguimientos/evidencias
// asociados a los hallazgos de prueba creados por el seed.
const IDS = {
  tenantACME: oid('6a0376fcba97a85a6ae4a3a0'),
  tenantEvil: oid('6a0376fcba97a85a6ae4a3a1'),
  clientA: oid('6a0376fcba97a85a6ae4a3a2'),
  clientB: oid('6a0376fcba97a85a6ae4a3a3'),
  areaInfra: oid('6a0376fcba97a85a6ae4a3a4'),
  areaApps: oid('6a0376fcba97a85a6ae4a3a5'),
  projectA: oid('6a0376fcba97a85a6ae4a3a6'),
  projectB: oid('6a0376fcba97a85a6ae4a3a7'),
  userAdmin: oid('6a0376fcba97a85a6ae4a3b9'),
  userOwner: oid('6a0376fcba97a85a6ae4a3ba'),
  userPlatformAdmin: oid('6a0376fcba97a85a6ae4a3bb'),
  userClientAdmin: oid('6a0376fcba97a85a6ae4a3bc'),
  userAreaAdmin: oid('6a0376fcba97a85a6ae4a3bd'),
  userAnalyst: oid('6a0376fcba97a85a6ae4a3be'),
  userViewer: oid('6a0376fcba97a85a6ae4a3bf'),
  findingSqlInjection: oid('6a0376fcba97a85a6ae4a3c4'),
  findingXss: oid('6a0376fcba97a85a6ae4a3c5'),
  findingLogs: oid('6a0376fcba97a85a6ae4a3c6'),
  findingEvil: oid('6a0376fcba97a85a6ae4a3c7')
};

async function seedTestData() {
  log('\n🌱 Iniciando seed de datos de prueba P0...', 'blue');

  try {
    await mongoose.connect(MONGO_URI);
    log('✅ Conectado a MongoDB', 'green');

    // Limpiar datos previos
    log('\n🗑️  Limpiando colecciones de test...', 'yellow');

    await mongoose.connection.db.collection('userareaassignments').deleteMany({});

    await mongoose.connection.db.collection('users').deleteMany({
      email: {
        $in: [
          'admin@shieldtrack.com',
          'owner@shieldtrack.com',
          'platformadmin@shieldtrack.com',
          'clientadmin@acmecorp.com',
          'areaadmin@acmecorp.com',
          'analyst@shieldtrack.com',
          'viewer@shieldtrack.com'
        ]
      }
    });

    await mongoose.connection.db.collection('clients').deleteMany({
      code: { $in: ['TEST-ACME', 'TEST-EVIL'] }
    });

    await mongoose.connection.db.collection('areas').deleteMany({
      code: { $in: ['TEST-INFRA', 'TEST-APPS'] }
    });

    await mongoose.connection.db.collection('projects').deleteMany({
      code: { $in: ['TEST-PROJECT-001', 'TEST-PROJECT-EVIL'] }
    });

    await mongoose.connection.db.collection('findings').deleteMany({
      code: { $in: ['FND-TEST-001', 'FND-TEST-002', 'FND-TEST-003', 'FND-EVIL-001'] }
    });

    await mongoose.connection.db.collection('tenants').deleteMany({
      code: { $in: ['TEN-ACME', 'TEN-EVIL'] }
    });

    log('✅ Colecciones limpias', 'green');

    // === TENANTS ===
    log('\n🏢 Creando tenants de prueba...', 'blue');

    const tenantACME = await mongoose.connection.db.collection('tenants').insertOne({
      _id: IDS.tenantACME,
      name: 'ACME Corporation',
      code: 'TEN-ACME',
      isActive: true,
      createdAt: new Date()
    });

    const tenantEvil = await mongoose.connection.db.collection('tenants').insertOne({
      _id: IDS.tenantEvil,
      name: 'Evil Corp',
      code: 'TEN-EVIL',
      isActive: true,
      createdAt: new Date()
    });

    log(`✅ Tenant ACME: ${tenantACME.insertedId}`, 'green');
    log(`✅ Tenant Evil: ${tenantEvil.insertedId}`, 'green');

    // === CLIENTES ===
    log('\n👥 Creando clientes de prueba...', 'blue');

    const clientA = await mongoose.connection.db.collection('clients').insertOne({
      _id: IDS.clientA,
      name: 'ACME Corporation',
      code: 'TEST-ACME',
      isActive: true,
      tenantId: tenantACME.insertedId,
      createdAt: new Date()
    });

    const clientB = await mongoose.connection.db.collection('clients').insertOne({
      _id: IDS.clientB,
      name: 'Evil Corp',
      code: 'TEST-EVIL',
      isActive: true,
      tenantId: tenantEvil.insertedId,
      createdAt: new Date()
    });

    log(`✅ Cliente A (ACME): ${clientA.insertedId}`, 'green');
    log(`✅ Cliente B (Evil): ${clientB.insertedId}`, 'green');

    // === ÁREAS ===
    const areaInfra = await mongoose.connection.db.collection('areas').insertOne({
      _id: IDS.areaInfra,
      name: 'Infraestructura',
      code: 'TEST-INFRA',
      clientId: clientA.insertedId,
      tenantId: tenantACME.insertedId,
      isActive: true,
      createdAt: new Date()
    });

    const areaApps = await mongoose.connection.db.collection('areas').insertOne({
      _id: IDS.areaApps,
      name: 'Aplicaciones',
      code: 'TEST-APPS',
      clientId: clientA.insertedId,
      tenantId: tenantACME.insertedId,
      isActive: true,
      createdAt: new Date()
    });

    // === USUARIOS ===
    log('\n🔐 Creando usuarios con roles RBAC...', 'blue');

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const hashedDevPassword = await bcrypt.hash('Admin123!', 10);

    const users = await mongoose.connection.db.collection('users').insertMany([
      {
        _id: IDS.userAdmin,
        email: 'admin@shieldtrack.com',
        password: hashedDevPassword,
        firstName: 'Dev',
        lastName: 'Admin',
        role: 'OWNER',
        tenantIds: [tenantACME.insertedId, tenantEvil.insertedId],
        mfaEnabled: false,
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: IDS.userOwner,
        email: 'owner@shieldtrack.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Owner',
        role: 'OWNER',
        tenantIds: [tenantACME.insertedId],
        activeTenantId: tenantACME.insertedId,
        mfaEnabled: false,
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: IDS.userPlatformAdmin,
        email: 'platformadmin@shieldtrack.com',
        password: hashedPassword,
        firstName: 'Platform',
        lastName: 'Admin',
        role: 'PLATFORM_ADMIN',
        tenantIds: [tenantACME.insertedId],
        activeTenantId: tenantACME.insertedId,
        mfaEnabled: false,
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: IDS.userClientAdmin,
        email: 'clientadmin@acmecorp.com',
        password: hashedPassword,
        firstName: 'Client',
        lastName: 'Admin',
        role: 'CLIENT_ADMIN',
        clientId: clientA.insertedId,
        tenantIds: [tenantACME.insertedId],
        activeTenantId: tenantACME.insertedId,
        mfaEnabled: false,
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: IDS.userAreaAdmin,
        email: 'areaadmin@acmecorp.com',
        password: hashedPassword,
        firstName: 'Area',
        lastName: 'Admin',
        role: 'AREA_ADMIN',
        clientId: clientA.insertedId,
        areaId: areaInfra.insertedId,
        tenantIds: [tenantACME.insertedId],
        activeTenantId: tenantACME.insertedId,
        mfaEnabled: false,
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: IDS.userAnalyst,
        email: 'analyst@shieldtrack.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Analyst',
        role: 'ANALYST',
        clientId: clientA.insertedId,
        tenantIds: [tenantACME.insertedId],
        activeTenantId: tenantACME.insertedId,
        mfaEnabled: false,
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: IDS.userViewer,
        email: 'viewer@shieldtrack.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Viewer',
        role: 'VIEWER',
        clientId: clientA.insertedId,
        tenantIds: [tenantACME.insertedId],
        activeTenantId: tenantACME.insertedId,
        mfaEnabled: false,
        isActive: true,
        createdAt: new Date()
      }
    ]);

    log('✅ 7 usuarios creados', 'green');

    // === ASIGNACIONES DE ÁREA ===
    log('\n🔗 Asignando usuarios a áreas...', 'blue');

    const ownerId = users.insertedIds[0];
    const areaAdminId = users.insertedIds[4];

    await mongoose.connection.db.collection('userareaassignments').insertMany([
      {
        userId: areaAdminId,
        areaId: areaInfra.insertedId,
        assignedBy: ownerId,
        assignedAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: areaAdminId,
        areaId: areaApps.insertedId,
        assignedBy: ownerId,
        assignedAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    log('✅ Area Admin asignado a Infraestructura y Aplicaciones', 'green');

    // === PROYECTOS ===
    log('\n📂 Creando proyectos de prueba...', 'blue');

    const projectA = await mongoose.connection.db.collection('projects').insertOne({
      _id: IDS.projectA,
      name: 'Pentesting ACME Web Portal',
      code: 'TEST-PROJECT-001',
      clientId: clientA.insertedId,
      areaId: areaApps.insertedId,
      tenantId: tenantACME.insertedId,
      serviceArchitecture: 'WEB',
      projectStatus: 'ACTIVE',
      retestPolicy: {
        enabled: true,
        nextRetestAt: new Date('2025-12-30'),
        notify: {
          recipients: ['soc@acmecorp.com', 'lead@acmecorp.com'],
          offsetDays: [30, 15, 3, 1]
        }
      },
      createdAt: new Date()
    });

    const projectB_EvilCorp = await mongoose.connection.db.collection('projects').insertOne({
      _id: IDS.projectB,
      name: 'Red Team Engagement Evil Corp',
      code: 'TEST-PROJECT-EVIL',
      clientId: clientB.insertedId,
      tenantId: tenantEvil.insertedId,
      serviceArchitecture: 'CLOUD',
      projectStatus: 'ACTIVE',
      retestPolicy: { enabled: false },
      createdAt: new Date()
    });

    log(`✅ Proyecto ACME: ${projectA.insertedId}`, 'green');
    log(`✅ Proyecto Evil Corp (IDOR test): ${projectB_EvilCorp.insertedId}`, 'green');

    // === HALLAZGOS ===
    log('\n🔍 Creando hallazgos para testing...', 'blue');

    const findingsA = await mongoose.connection.db.collection('findings').insertMany([
      {
        _id: IDS.findingSqlInjection,
        code: 'FND-TEST-001',
        title: 'SQL Injection en login',
        severity: 'CRITICAL',
        status: 'OPEN',
        projectId: projectA.insertedId,
        tenantId: tenantACME.insertedId,
        retestIncluded: true,
        description: 'Hallazgo de prueba 1',
        createdAt: new Date()
      },
      {
        _id: IDS.findingXss,
        code: 'FND-TEST-002',
        title: 'XSS Reflected en búsqueda',
        severity: 'HIGH',
        status: 'IN_PROGRESS',
        projectId: projectA.insertedId,
        tenantId: tenantACME.insertedId,
        retestIncluded: true,
        description: 'Hallazgo de prueba 2',
        createdAt: new Date()
      },
      {
        _id: IDS.findingLogs,
        code: 'FND-TEST-003',
        title: 'Información sensible en logs',
        severity: 'MEDIUM',
        status: 'OPEN',
        projectId: projectA.insertedId,
        tenantId: tenantACME.insertedId,
        retestIncluded: false,
        description: 'Hallazgo de prueba 3',
        createdAt: new Date()
      }
    ]);

    const findingEvilCorp = await mongoose.connection.db.collection('findings').insertOne({
      _id: IDS.findingEvil,
      code: 'FND-EVIL-001',
      title: 'RCE en API Gateway (Evil Corp - CONFIDENCIAL)',
      severity: 'CRITICAL',
      status: 'OPEN',
      projectId: projectB_EvilCorp.insertedId,
      tenantId: tenantEvil.insertedId,
      retestIncluded: true,
      description: '🔒 Este hallazgo NO debe ser accesible por usuarios de ACME Corp',
      createdAt: new Date()
    });

    log('✅ 3 hallazgos ACME creados', 'green');
    log(`✅ 1 hallazgo Evil Corp (IDOR test): ${findingEvilCorp.insertedId}`, 'green');

    log('\n✅ Seed completado exitosamente!', 'green');

  } catch (error) {
    log(`\n❌ Error en seed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log('\n👋 Desconectado de MongoDB', 'blue');
  }
}

if (require.main === module) {
  seedTestData();
}

module.exports = { seedTestData };
