#!/usr/bin/env node

/**
 * Script de inicialización - Usuario OWNER
 * Crea el usuario administrador principal del sistema
 * 
 * Uso: npm run seed:owner
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';

// 🔐 CREDENCIALES DE DESARROLLO - CAMBIAR EN PRODUCCIÓN
const OWNER_EMAIL = 'admin@shieldtrack.com';
const OWNER_PASSWORD = 'Admin123!';

async function createOwner() {
  console.log('\n🔐 Creando usuario OWNER del sistema...\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const usersCollection = mongoose.connection.db.collection('users');

    // Verificar si ya existe
    const existingOwner = await usersCollection.findOne({ email: OWNER_EMAIL });
    
    if (existingOwner) {
      console.log('⚠️  Usuario OWNER ya existe');
      console.log(`   Email: ${OWNER_EMAIL}`);
      console.log(`   ID: ${existingOwner._id}`);
      console.log('   Para recrearlo, elimínalo primero de la BD\n');
      return;
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(OWNER_PASSWORD, 10);

    // Crear usuario OWNER
    const result = await usersCollection.insertOne({
      email: OWNER_EMAIL,
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'OWNER',
      mfaEnabled: false, // Para desarrollo - en prod debe ser true
      mfaSecret: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Usuario OWNER creado exitosamente!\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('   📧 Email:    ', OWNER_EMAIL);
    console.log('   🔑 Password: ', OWNER_PASSWORD);
    console.log('   🆔 ID:       ', result.insertedId);
    console.log('   👤 Rol:      ', 'OWNER');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   - MFA está deshabilitado para desarrollo');
    console.log('   - En producción: cambiar contraseña y habilitar MFA');
    console.log('   - Este usuario tiene acceso TOTAL al sistema\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB\n');
  }
}

if (require.main === module) {
  createOwner();
}

module.exports = { createOwner, OWNER_EMAIL, OWNER_PASSWORD };
