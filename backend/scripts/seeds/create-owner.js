#!/usr/bin/env node

/**
 * Script de inicializacion - Usuario OWNER
 * Crea o normaliza el usuario administrador principal del sistema.
 *
 * Uso: npm run seed:owner
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';

// CREDENCIALES DE DESARROLLO - CAMBIAR EN PRODUCCION
const OWNER_EMAIL = 'admin@shieldtrack.com';
const OWNER_PASSWORD = 'Admin123!';

async function createOwner() {
  console.log('\nCreando/normalizando usuario OWNER del sistema...\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Conectado a MongoDB');

    const usersCollection = mongoose.connection.db.collection('users');
    const hashedPassword = await bcrypt.hash(OWNER_PASSWORD, 10);

    const existingOwner = await usersCollection.findOne({ email: OWNER_EMAIL });

    if (existingOwner) {
      await usersCollection.updateOne(
        { email: OWNER_EMAIL },
        {
          $set: {
            password: hashedPassword,
            firstName: existingOwner.firstName || 'System',
            lastName: existingOwner.lastName || 'Administrator',
            role: 'OWNER',
            mfaEnabled: false,
            mfaSecret: null,
            isActive: true,
            isDeleted: false,
            updatedAt: new Date()
          },
          $unset: {
            deletedAt: '',
            deletedBy: ''
          }
        }
      );

      console.log('Usuario OWNER ya existia; credenciales normalizadas.');
      console.log('==============================================');
      console.log('   Email:    ', OWNER_EMAIL);
      console.log('   Password: ', OWNER_PASSWORD);
      console.log('   ID:       ', existingOwner._id);
      console.log('   Rol:      ', 'OWNER');
      console.log('==============================================\n');
      return;
    }

    const result = await usersCollection.insertOne({
      email: OWNER_EMAIL,
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'OWNER',
      mfaEnabled: false,
      mfaSecret: null,
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Usuario OWNER creado exitosamente!\n');
    console.log('==============================================');
    console.log('   Email:    ', OWNER_EMAIL);
    console.log('   Password: ', OWNER_PASSWORD);
    console.log('   ID:       ', result.insertedId);
    console.log('   Rol:      ', 'OWNER');
    console.log('==============================================');
    console.log('\nIMPORTANTE:');
    console.log('   - MFA esta deshabilitado para desarrollo');
    console.log('   - En produccion: cambiar contrasena y habilitar MFA');
    console.log('   - Este usuario tiene acceso TOTAL al sistema\n');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB\n');
  }
}

if (require.main === module) {
  createOwner();
}

module.exports = { createOwner, OWNER_EMAIL, OWNER_PASSWORD };
