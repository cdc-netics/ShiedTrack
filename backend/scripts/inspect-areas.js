const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';

async function listAreas() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  try {
    const areas = await mongoose.connection.db.collection('areas').find({}).toArray();
    console.log('\n--- Current Areas in DB ---');
    areas.forEach(area => {
      console.log(`ID: ${area._id}, Name: "${area.name}", Code: "${area.code}", ClientID: ${area.clientId}`);
    });
    console.log('---------------------------\n');
    
    const clients = await mongoose.connection.db.collection('clients').find({}).toArray();
    console.log('\n--- Current Clients in DB ---');
    clients.forEach(client => {
        console.log(`ID: ${client._id}, Name: "${client.name}", Code: "${client.code}"`);
    });
    console.log('-----------------------------\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listAreas();
