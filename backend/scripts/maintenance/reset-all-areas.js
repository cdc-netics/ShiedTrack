const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';

async function resetAllAreas() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  try {
    console.log('WARNING: This will delete ALL Areas and User-Area Assignments.');
    
    // 1. Delete ALL Areas
    const areasResult = await mongoose.connection.db.collection('areas').deleteMany({});
    console.log(`Deleted ${areasResult.deletedCount} areas.`);

    // 2. Delete ALL UserAreaAssignments
    // Note: Mongoose default collection name for UserAreaAssignment is 'userareaassignments'
    const assignmentsResult = await mongoose.connection.db.collection('userareaassignments').deleteMany({});
    console.log(`Deleted ${assignmentsResult.deletedCount} user-area assignments.`);

    console.log('Reset complete. All areas and assignments have been wiped.');
  } catch (error) {
    console.error('Error during reset:', error);
  } finally {
    await mongoose.disconnect();
  }
}

resetAllAreas();
