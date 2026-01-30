const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';

async function fixUserClient() {
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

    // 2. Update the user to belong to this client
    const result = await mongoose.connection.db.collection('users').updateOne(
        { email: 'clientadmin@acmecorp.com' },
        { $set: { clientId: validClient._id } }
    );

    console.log(`Updated user clientadmin@acmecorp.com: ${result.modifiedCount} document(s) modified.`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixUserClient();
