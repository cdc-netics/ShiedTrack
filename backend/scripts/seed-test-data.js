#!/usr/bin/env node

/**
 * Script de seed para tests P0 de ShieldTrack
 * Crea datos de prueba alineados con Promp.txt
 * 
 * Uso:
 *   npm run seed:test
 *   node scripts/seed-test-data.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Modelos (importar según estructura del proyecto)
// const { User, Client, Area, Project, Finding } = require('../src/modules');

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

async function seedTestData() {
  log('\n🌱 Iniciando seed de datos de prueba P0...', 'blue');

  try {
    await mongoose.connect(MONGO_URI);
    log('✅ Conectado a MongoDB', 'green');

    // Limpiar datos previos
    log('\n🗑️  Limpiando colecciones de test...', 'yellow');
    await mongoose.connection.db.collection('users').deleteMany({ 
      email: { $regex: /@(shieldtrack\.com|acmecorp\.com)$/ } 
    });
    await mongoose.connection.db.collection('clients').deleteMany({ code: /^TEST-/ });
    await mongoose.connection.db.collection('areas').deleteMany({ code: /^TEST-/ });
    await mongoose.connection.db.collection('projects').deleteMany({ code: /^TEST-/ });
    await mongoose.connection.db.collection('findings').deleteMany({ code: /^FND-(TEST|EVIL)-/ });
    
    log('✅ Colecciones limpias', 'green');

    // === TENANTS ===
    log('\n🏢 Creando tenants de prueba...', 'blue');

    const tenantACME = await mongoose.connection.db.collection('tenants').insertOne({
      name: 'ACME Corporation',
      code: 'TEN-ACME',
      isActive: true,
      createdAt: new Date()
    });

    const tenantEvil = await mongoose.connection.db.collection('tenants').insertOne({
      name: 'Evil Corp',
      code: 'TEN-EVIL',
      isActive: true,
      createdAt: new Date()
    });

    log(`✅ Tenant ACME: ${tenantACME.insertedId}`, 'green');
    log(`✅ Tenant Evil: ${tenantEvil.insertedId}`, 'green');

    // === CLIENTES (asociados a Tenants) ===
    log('\n👥 Creando clientes de prueba...', 'blue');
    
    const clientA = await mongoose.connection.db.collection('clients').insertOne({
      name: 'ACME Corporation',
      code: 'TEST-ACME',
      isActive: true,
      tenantId: tenantACME.insertedId,
      createdAt: new Date()
    });
    
    const clientB = await mongoose.connection.db.collection('clients').insertOne({
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
      name: 'Infraestructura',
      code: 'TEST-INFRA',
      clientId: clientA.insertedId,
      tenantId: tenantACME.insertedId,
      isActive: true,
      createdAt: new Date()
    });

    const areaApps = await mongoose.connection.db.collection('areas').insertOne({
      name: 'Aplicaciones',
      code: 'TEST-APPS',
      clientId: clientA.insertedId,
      tenantId: tenantACME.insertedId,
      isActive: true,
      createdAt: new Date()
    });

    // === USUARIOS (6 roles según Promp.txt) ===
    log('\n🔐 Creando usuarios con los 6 roles RBAC...', 'blue');
    
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const hashedDevPassword = await bcrypt.hash('Admin123!', 10);
    
    const users = await mongoose.connection.db.collection('users').insertMany([
      {
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
        email: 'owner@shieldtrack.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Owner',
        role: 'OWNER',
        tenantIds: [tenantACME.insertedId],
        activeTenantId: tenantACME.insertedId,
        mfaEnabled: false, // Para testing (en prod debería ser true)
        isActive: true,
        createdAt: new Date()
      },
      {
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

    log('✅ 6 usuarios creados (password: Password123!)', 'green');

    // === ASIGNACIONES DE ÁREA ===
    log('\n🔗 Asignando usuarios a áreas...', 'blue');
    
    const ownerId = users.insertedIds[0];
    const areaAdminId = users.insertedIds[3];

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

    log(`✅ 3 hallazgos ACME creados`, 'green');
    log(`✅ 1 hallazgo Evil Corp (IDOR test): ${findingEvilCorp.insertedId}`, 'green');

    // === RESUMEN ===
    log('\n📊 RESUMEN DE DATOS SEED:', 'blue');
    log('─────────────────────────────────────────', 'blue');
    log(`Clientes: 2 (ACME + Evil Corp)`);
    log(`Áreas: 2 (Infraestructura + Aplicaciones)`);
    log(`Usuarios: 6 (OWNER, PLATFORM_ADMIN, CLIENT_ADMIN, AREA_ADMIN, ANALYST, VIEWER)`);
    log(`Proyectos: 2 (1 ACME con retest, 1 Evil Corp)`);
    log(`Hallazgos: 4 (3 ACME, 1 Evil Corp para IDOR)`);
    log('─────────────────────────────────────────', 'blue');

    log('\n✨ Variables para Postman Collection:', 'yellow');
    log(`test_project_id: ${projectA.insertedId}`);
    log(`other_client_finding_id: ${findingEvilCorp.insertedId}`);
    log(`test_finding_id: ${Object.values(findingsA.insertedIds)[0]}`);

    log('\n🔐 Credenciales de login:', 'yellow');
    log('────────────────────────────────────────');
    log('Email: owner@shieldtrack.com | Password: Password123!');
    log('Email: platformadmin@shieldtrack.com | Password: Password123!');
    log('Email: clientadmin@acmecorp.com | Password: Password123!');
    log('Email: areaadmin@acmecorp.com | Password: Password123!');
    log('Email: analyst@shieldtrack.com | Password: Password123!');
    log('Email: viewer@shieldtrack.com | Password: Password123!');
    log('────────────────────────────────────────');

    log('\n✅ Seed completado exitosamente!', 'green');
    log('📝 Ahora puedes ejecutar la Postman Collection P0', 'blue');

  } catch (error) {
    log(`\n❌ Error en seed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log('\n👋 Desconectado de MongoDB', 'blue');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  seedTestData();
}

module.exports = { seedTestData };
