import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { Session } from '../models';
import type { AuthPayload } from '../middleware/auth';

export function generateApiKey(): string {
  return `qc_${uuidv4().replace(/-/g, '')}`;
}

export function generateTenantId(): string {
  return `tenant_${uuidv4().slice(0, 8)}`;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: AuthPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'],
    jwtid: uuidv4(),
  };
  return jwt.sign(payload, config.jwt.secret, options);
}

export async function createSession(
  userId: string,
  websiteId: string,
  token: string,
  meta?: { userAgent?: string; ipAddress?: string }
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await Session.findOneAndUpdate(
    { token },
    {
      userId,
      websiteId,
      token,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
      expiresAt,
      isActive: true,
    },
    { upsert: true, new: true }
  );
}

export function toPublicUser(user: {
  _id: { toString(): string };
  websiteId: { toString(): string };
  externalId?: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
  isOnline: boolean;
  lastSeenAt?: Date;
  createdAt: Date;
}) {
  return {
    _id: user._id.toString(),
    websiteId: user.websiteId.toString(),
    externalId: user.externalId,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isOnline: user.isOnline,
    lastSeenAt: user.lastSeenAt,
    createdAt: user.createdAt,
  };
}

export function paginate(page = 1, limit = 20) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;
  return { page: safePage, limit: safeLimit, skip };
}
