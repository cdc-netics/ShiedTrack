#!/usr/bin/env node

/**
 * Script para listar todos los clientes y sus IDs
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';

async function listClients() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    const Client = mongoose.connection.collection('clients');
    const clients = await Client.find({}).toArray();
    
    console.log(`📊 Total de Clientes: ${clients.length}\n`);
    
    clients.forEach((client, idx) => {
      console.log(`${idx + 1}. ${client.name}`);
      console.log(`   ID: ${client._id}`);
      console.log(`   Activo: ${!client.isDeleted}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

listClients();
