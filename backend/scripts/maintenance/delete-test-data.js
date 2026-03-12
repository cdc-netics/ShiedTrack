const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';

async function cleanTestData() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  try {
    console.log('Removing test data...');
    
    // Delete Clients starting with TEST-
    const clientsResult = await mongoose.connection.db.collection('clients').deleteMany({ 
      code: /^TEST-/ 
    });
    console.log(`Deleted ${clientsResult.deletedCount} test clients.`);

    // Delete Areas starting with TEST-
    const areasResult = await mongoose.connection.db.collection('areas').deleteMany({ 
      code: /^TEST-/ 
    });
    console.log(`Deleted ${areasResult.deletedCount} test areas.`);

    // Delete Projects starting with TEST-
    const projectsResult = await mongoose.connection.db.collection('projects').deleteMany({ 
      code: /^TEST-/ 
    });
    console.log(`Deleted ${projectsResult.deletedCount} test projects.`);

    // Delete Findings starting with FND-TEST- or FND-EVIL-
    const findingsResult = await mongoose.connection.db.collection('findings').deleteMany({ 
      code: /^FND-(TEST|EVIL)-/ 
    });
    console.log(`Deleted ${findingsResult.deletedCount} test findings.`);

    console.log('Cleanup complete.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanTestData();
