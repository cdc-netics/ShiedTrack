const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';

async function inspectData() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  try {
    // 1. List Users (email, role, clientId)
    const users = await mongoose.connection.db.collection('users').find({
        email: { $in: ['owner@shieldtrack.com', 'clientadmin@acmecorp.com'] }
    }).toArray();
    
    console.log('\n--- Users ---');
    users.forEach(u => {
        console.log(`User: ${u.email}, Role: ${u.role}, ClientID: ${u.clientId}`);
    });

    // 2. List Areas (name, clientId)
    const areas = await mongoose.connection.db.collection('areas').find({}).toArray();
    console.log('\n--- Areas ---');
    areas.forEach(a => {
        console.log(`Area: ${a.name}, Code: ${a.code}, ClientID: ${a.clientId}`);
    });

    // 3. List Clients
    const clients = await mongoose.connection.db.collection('clients').find({}).toArray();
    console.log('\n--- Clients ---');
    clients.forEach(c => {
        console.log(`Client: ${c.name}, ID: ${c._id}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

inspectData();
