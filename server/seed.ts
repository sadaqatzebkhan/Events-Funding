import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectToMongoDB } from './mongodb.js';

dotenv.config();

/**
 * Resets the app back to its clean admin-only seed state by clearing every
 * MongoDB collection. The next request (`Database.init()`) regenerates the
 * seed automatically, since it seeds whenever the `users` collection is empty.
 */
async function seed() {
  const connected = await connectToMongoDB();
  if (!connected) {
    console.error('❌ Could not connect to MongoDB — check MONGODB_URI. Nothing was reset.');
    process.exit(1);
  }

  const db = mongoose.connection.db!;
  const collections = await db.listCollections().toArray();
  for (const { name } of collections) {
    await db.collection(name).deleteMany({});
    console.log(`🗑️  Cleared MongoDB collection: ${name}`);
  }
  await mongoose.disconnect();

  console.log('✅ Reset complete. The next request (or `npm run dev`) regenerates the admin-only seed.');
}

seed().catch((err) => {
  console.error('❌ Seed reset failed:', err);
  process.exit(1);
});
