import mongoose, { Schema, Document } from 'mongoose';
import { USER_ROLES, WIDGET_POSITIONS } from '@quantum-chat/shared';
import type { UserRole, WebsiteBranding, WebsiteSettings } from '@quantum-chat/shared';

export interface IWebsiteDocument extends Document {
  tenantId: string;
  name: string;
  domain: string;
  apiKey: string;
  isVerified: boolean;
  isActive: boolean;
  branding: WebsiteBranding;
  settings: WebsiteSettings;
  createdAt: Date;
  updatedAt: Date;
}

const brandingSchema = new Schema<WebsiteBranding>(
  {
    primaryColor: { type: String, default: '#0A66C2' },
    secondaryColor: { type: String, default: '#F3F2EF' },
    accentColor: { type: String, default: '#057642' },
    logoUrl: { type: String },
    welcomeMessage: { type: String, default: 'Welcome to Quantum Chat!' },
    position: {
      type: String,
      enum: Object.values(WIDGET_POSITIONS),
      default: WIDGET_POSITIONS.BOTTOM_RIGHT,
    },
    fontFamily: { type: String, default: 'system-ui, sans-serif' },
  },
  { _id: false }
);

const settingsSchema = new Schema<WebsiteSettings>(
  {
    allowFileUploads: { type: Boolean, default: true },
    allowReactions: { type: Boolean, default: true },
    allowEditing: { type: Boolean, default: true },
    maxFileSizeMb: { type: Number, default: 25 },
    notificationSound: { type: Boolean, default: true },
  },
  { _id: false }
);

const websiteSchema = new Schema<IWebsiteDocument>(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    domain: { type: String, required: true, index: true },
    apiKey: { type: String, required: true, unique: true, index: true },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    branding: { type: brandingSchema, default: () => ({}) },
    settings: { type: settingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const Website = mongoose.model<IWebsiteDocument>('Website', websiteSchema);
