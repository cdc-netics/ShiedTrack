#!/usr/bin/env node

/**
 * Script de diagnóstico para verificar hallazgos y proyectos
 * Uso: node scripts/diagnose-export.js <clientId>
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';

async function diagnose(clientId) {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Buscar cliente
    const Client = mongoose.connection.collection('clients');
    const client = await Client.findOne({ _id: new mongoose.Types.ObjectId(clientId) });
    
    if (!client) {
      console.log('❌ Cliente no encontrado:', clientId);
      return;
    }

    console.log('📊 Cliente:', client.name);
    console.log('   ID:', clientId, '\n');

    // Buscar proyectos del cliente
    const Project = mongoose.connection.collection('projects');
    const projects = await Project.find({ clientId: new mongoose.Types.ObjectId(clientId) }).toArray();
    
    console.log(`📁 Proyectos encontrados: ${projects.length}`);
    projects.forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.name} (${p._id})`);
    });
    console.log('');

    if (projects.length === 0) {
      console.log('⚠️  No hay proyectos para este cliente');
      return;
    }

    // Buscar hallazgos
    const Finding = mongoose.connection.collection('findings');
    const projectIds = projects.map(p => p._id);
    
    console.log('🔍 Buscando hallazgos en proyectos:', projectIds.map(id => id.toString()), '\n');

    const findings = await Finding.find({ projectId: { $in: projectIds } }).toArray();
    
    console.log(`🎯 Hallazgos encontrados: ${findings.length}`);
    findings.forEach((f, idx) => {
      const project = projects.find(p => p._id.toString() === f.projectId.toString());
      console.log(`   ${idx + 1}. [${f.severity}] ${f.code} - ${f.title}`);
      console.log(`      Proyecto: ${project ? project.name : 'DESCONOCIDO'} (${f.projectId})`);
      console.log(`      Estado: ${f.status}`);
    });

    // Verificar hallazgos sin proyecto válido
    const allFindings = await Finding.find({}).toArray();
    const orphanedFindings = allFindings.filter(f => {
      return !projectIds.some(pId => pId.toString() === f.projectId?.toString());
    });

    if (orphanedFindings.length > 0) {
      console.log(`\n⚠️  Hallazgos huérfanos (sin proyecto válido): ${orphanedFindings.length}`);
      orphanedFindings.forEach((f, idx) => {
        console.log(`   ${idx + 1}. [${f.severity}] ${f.code} - ${f.title}`);
        console.log(`      ProjectId inválido: ${f.projectId}`);
      });
    }

    console.log('\n✅ Diagnóstico completado');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

const clientId = process.argv[2];

if (!clientId) {
  console.log('Uso: node scripts/diagnose-export.js <clientId>');
  console.log('Ejemplo: node scripts/diagnose-export.js 507f1f77bcf86cd799439011');
  process.exit(1);
}

diagnose(clientId);
