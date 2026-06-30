import mongoose, { Schema, Document, Types } from 'mongoose';
import { USER_ROLES } from '@quantum-chat/shared';
import type { UserRole } from '@quantum-chat/shared';

export interface IUserDocument extends Document {
  websiteId: Types.ObjectId;
  externalId?: string;
  email: string;
  passwordHash?: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  isBlocked: boolean;
  isOnline: boolean;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    websiteId: { type: Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
    externalId: { type: String, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    displayName: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },
    isBlocked: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    lastSeenAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ websiteId: 1, email: 1 }, { unique: true });
userSchema.index({ websiteId: 1, externalId: 1 }, { sparse: true });
userSchema.index({ websiteId: 1, displayName: 'text', email: 'text' });

export const User = mongoose.model<IUserDocument>('User', userSchema);
