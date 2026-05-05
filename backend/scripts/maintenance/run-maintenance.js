const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';

async function runMaintenance(taskName) {
  console.log(`🚀 Reparing ShieldTrack Data: ${taskName}`);
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  const db = mongoose.connection.db;

  try {
    switch (taskName) {
      case 'fix-users':
        console.log('Fixing user-client relationships...');
        const validClient = await db.collection('clients').findOne({ name: 'cliente 1' });
        if (validClient) {
          const res = await db.collection('users').updateMany(
            { email: { $in: ['viewer@shieldtrack.com', 'analyst@shieldtrack.com'] } },
            { $set: { clientId: validClient._id } }
          );
          console.log(`Updated ${res.modifiedCount} users to client: ${validClient.name}`);
        }
        
        const acmeClient = await db.collection('clients').findOne({ code: 'TEST-ACME' });
        if (acmeClient) {
          const res = await db.collection('users').updateOne(
            { email: 'clientadmin@acmecorp.com' },
            { $set: { clientId: acmeClient._id } }
          );
          console.log(`Updated clientadmin to client: ${acmeClient.name}`);
        }
        break;

      case 'fix-indexes':
        console.log('Cleaning problematic indexes...');
        const collections = ['areas', 'users', 'clients'];
        for (const colName of collections) {
          const col = db.collection(colName);
          const indexes = await col.indexes();
          // Drop redundant or problematic global unique indexes
          if (indexes.find(i => i.name === 'code_1')) { await col.dropIndex('code_1'); console.log(`Dropped code_1 from ${colName}`); }
          if (indexes.find(i => i.name === 'name_1' && i.unique)) { await col.dropIndex('name_1'); console.log(`Dropped unique name_1 from ${colName}`); }
        }
        break;

      case 'clean-test-data':
        console.log('Deleting test data...');
        const emailFilter = { email: { $regex: /@shieldtrack\.com$|@acmecorp\.com$/ } };
        const delUsers = await db.collection('users').deleteMany(emailFilter);
        console.log(`Deleted ${delUsers.deletedCount} test users.`);
        break;

      case 'reset-areas':
        console.log('Resetting area catalog...');
        await db.collection('areas').deleteMany({});
        console.log('Areas cleared.');
        break;

      default:
        console.log('Unknown task. Available: fix-users, fix-indexes, clean-test-data, reset-areas');
    }
  } catch (error) {
    console.error('Error during maintenance:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

const arg = process.argv[2];
if (arg) {
  runMaintenance(arg);
} else {
  console.log('Please specify a task: node run-maintenance.js [task]');
}
