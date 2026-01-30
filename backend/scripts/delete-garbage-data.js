const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';

async function cleanSpecificData() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  try {
    console.log('Removing specific garbage data...');
    
    // 1. Delete Areas with specific codes "APPS" and "INFRA"
    const result1 = await mongoose.connection.db.collection('areas').deleteMany({ 
      code: { $in: ['APPS', 'INFRA'] } 
    });
    console.log(`Deleted ${result1.deletedCount} areas with codes APPS/INFRA.`);

    // 2. Delete Areas named "Infraestructura" with no code or "undefined" string
    const result2 = await mongoose.connection.db.collection('areas').deleteMany({ 
      name: 'Infraestructura',
      $or: [{ code: { $exists: false } }, { code: 'undefined' }, { code: null }]
    });
    console.log(`Deleted ${result2.deletedCount} areas named 'Infraestructura' with invalid code.`);

    // 3. Delete Areas named "Aplicaciones" (just in case)
    const result3 = await mongoose.connection.db.collection('areas').deleteMany({ 
      name: 'Aplicaciones',
      code: { $ne: 'TEST-APPS' } // Avoid double counting if previous script missed something, though unlikely
    });
    console.log(`Deleted ${result3.deletedCount} areas named 'Aplicaciones'.`);

    console.log('Cleanup complete.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanSpecificData();
