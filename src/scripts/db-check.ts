import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  console.log('Connecting to:', uri.replace(/:([^:@/]+)@/, ':****@'));
  await mongoose.connect(uri);

  const db = mongoose.connection.db!;
  const collections = await db.listCollections().toArray();

  console.log('Database:', db.databaseName);
  console.log('Connection host:', mongoose.connection.host);
  console.log('Collections:', collections.length);

  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`  - ${col.name}: ${count} documents`);
  }

  const { Website, User } = await import('../models');
  const websiteCount = await Website.countDocuments();
  const userCount = await User.countDocuments();
  console.log('Mongoose Website.countDocuments():', websiteCount);
  console.log('Mongoose User.countDocuments():', userCount);

  const sampleWebsite = await Website.findOne();
  if (sampleWebsite) {
    console.log('Sample website:', sampleWebsite._id.toString(), sampleWebsite.name, sampleWebsite.apiKey);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
