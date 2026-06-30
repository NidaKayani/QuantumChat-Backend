import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISessionDocument extends Document {
  userId: Types.ObjectId;
  websiteId: Types.ObjectId;
  token: string;
  userAgent?: string;
  ipAddress?: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const sessionSchema = new Schema<ISessionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    websiteId: { type: Schema.Types.ObjectId, ref: 'Website', required: true },
    token: { type: String, required: true, unique: true, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Session = mongoose.model<ISessionDocument>('Session', sessionSchema);
