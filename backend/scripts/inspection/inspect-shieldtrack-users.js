const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';

async function inspectShieldTrackUsers() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  try {
    const users = await mongoose.connection.db.collection('users').find({
        email: { $in: ['viewer@shieldtrack.com', 'analyst@shieldtrack.com'] }
    }).toArray();
    
    console.log('\n--- ShieldTrack Users ---');
    users.forEach(u => {
        console.log(`User: ${u.email}, Role: ${u.role}, ClientID: ${u.clientId}`);
    });

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

inspectShieldTrackUsers();
