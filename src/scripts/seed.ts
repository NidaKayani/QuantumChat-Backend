import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { config } from '../config';
import { Website, User } from '../models';
import { generateApiKey, generateTenantId, hashPassword } from '../utils/helpers';
import { USER_ROLES } from '@quantum-chat/shared';

async function seed(): Promise<void> {
  await mongoose.connect(config.mongodbUri);
  console.log('Connected to MongoDB');

  let website = await Website.findOne({ domain: 'localhost' });
  if (!website) {
    website = await Website.create({
      tenantId: generateTenantId(),
      name: 'QuantumChat',
      domain: 'localhost',
      apiKey: generateApiKey(),
      isVerified: true,
      isActive: true,
      branding: {
        primaryColor: '#0A1628',
        secondaryColor: '#1A365D',
        accentColor: '#3B82F6',
        welcomeMessage: 'Secure professional messaging',
        position: 'bottom-right',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
    });
    console.log('Created website:', website.tenantId);
    console.log('API Key:', website.apiKey);
  } else if (website.name === 'Demo Website') {
    website.name = 'QuantumChat';
    website.branding.welcomeMessage = 'Secure professional messaging';
    await website.save();
    console.log('Updated website name to QuantumChat');
  }

  const adminEmail = config.admin.email;
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      websiteId: website._id,
      email: adminEmail,
      passwordHash: await hashPassword(config.admin.password),
      displayName: 'Super Admin',
      role: USER_ROLES.SUPER_ADMIN,
    });
    console.log('Created admin user:', adminEmail);
    console.log('Password:', config.admin.password);
  }

  const demoUsers = [
    { email: 'alice@demo.com', displayName: 'Alice Johnson' },
    { email: 'bob@demo.com', displayName: 'Bob Smith' },
    { email: 'carol@demo.com', displayName: 'Carol Williams' },
  ];

  for (const u of demoUsers) {
    const exists = await User.findOne({ websiteId: website._id, email: u.email });
    if (!exists) {
      await User.create({
        websiteId: website._id,
        email: u.email,
        displayName: u.displayName,
        role: USER_ROLES.USER,
      });
      console.log('Created demo user:', u.displayName);
    }
  }

  console.log('\nSeed complete!');
  console.log('Website ID:', website._id.toString());
  console.log('\nUpdate frontend/widget/.env with:');
  console.log(`VITE_API_KEY=${website.apiKey}`);
  console.log(`VITE_WEBSITE_ID=${website._id.toString()}`);
  await mongoose.disconnect();
}

seed().catch(console.error);
