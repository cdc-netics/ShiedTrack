const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';

async function fixAllAcmeUsers() {
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

    // 2. Find all users with @acmecorp.com email
    const acmeUsers = await mongoose.connection.db.collection('users').find({ 
        email: /@acmecorp\.com$/ 
    }).toArray();

    console.log(`Found ${acmeUsers.length} users with @acmecorp.com email.`);

    // 3. Update all of them to the valid client
    const result = await mongoose.connection.db.collection('users').updateMany(
        { email: /@acmecorp\.com$/ },
        { $set: { clientId: validClient._id } }
    );

    console.log(`Updated ${result.modifiedCount} users to belong to client ${validClient.name}.`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixAllAcmeUsers();
