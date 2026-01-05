const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixIndexes() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const collection = mongoose.connection.collection('areas');
    
    console.log('Listing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    const codeIndex = indexes.find(idx => idx.name === 'code_1');
    if (codeIndex) {
      console.log('Found problematic index "code_1". Dropping it...');
      await collection.dropIndex('code_1');
      console.log('Index "code_1" dropped successfully.');
    } else {
      console.log('Index "code_1" not found.');
    }

    // Also check for name_1 if it exists and shouldn't be unique globally
    const nameIndex = indexes.find(idx => idx.name === 'name_1');
    if (nameIndex && nameIndex.unique) {
        console.log('Found unique index "name_1". Dropping it (should be unique per client)...');
        await collection.dropIndex('name_1');
        console.log('Index "name_1" dropped successfully.');
    }

    console.log('Done.');
  } catch (error) {
    console.error('Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixIndexes();
