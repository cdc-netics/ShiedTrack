const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';

async function fixUserClient() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  try {
    // Buscar un cliente válido y estable para pruebas
    const validClient = await mongoose.connection.db.collection('clients').findOne({
      code: 'TEST-ACME'
    });

    if (!validClient) {
      console.error('Error: Could not find client with code "TEST-ACME".');
      return;
    }

    console.log(`Found valid client: ${validClient.name} (${validClient._id})`);

    // Actualizar el usuario para asignarlo a ese cliente
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'clientadmin@acmecorp.com' },
      {
        $set: {
          clientId: validClient._id
        }
      }
    );

    console.log(`Updated user clientadmin@acmecorp.com: ${result.modifiedCount} document(s) modified.`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

fixUserClient();