const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';

async function fixShieldTrackUsers() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  try {
    // 1. Get the valid client "cliente 1"
    const validClient = await mongoose.connection.db.collection('clients').findOne({ name: 'cliente 1' });
    
    if (!validClient) {
        console.error('Error: Could not find "cliente 1".');
        return;
    }
    console.log(`Found valid client: ${validClient.name} (${validClient._id})`);

    // 2. Update viewer and analyst
    const result = await mongoose.connection.db.collection('users').updateMany(
        { email: { $in: ['viewer@shieldtrack.com', 'analyst@shieldtrack.com'] } },
        { $set: { clientId: validClient._id } }
    );

    console.log(`Updated ${result.modifiedCount} ShieldTrack users to belong to client ${validClient.name}.`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixShieldTrackUsers();
