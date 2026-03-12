
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';

async function checkUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log(`Found ${users.length} users.`);

    for (const user of users) {
      console.log(`User: ${user.email}, Role: ${user.role}`);
      // Check password 'Admin123!' for admin
      if (user.email === 'admin@shieldtrack.com') {
        const match = await bcrypt.compare('Admin123!', user.password);
        console.log(`  Password 'Admin123!' match: ${match}`);
      }
      // Check password 'Password123!' for owner
      if (user.email === 'owner@shieldtrack.com') {
        const match = await bcrypt.compare('Password123!', user.password);
        console.log(`  Password 'Password123!' match: ${match}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();
