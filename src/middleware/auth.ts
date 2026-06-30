import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, Website, Session } from '../models';
import { USER_ROLES } from '@quantum-chat/shared';
import type { UserRole } from '@quantum-chat/shared';

export interface AuthPayload {
  userId: string;
  websiteId: string;
  role: UserRole;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
  website?: InstanceType<typeof Website>;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;

    const session = await Session.findOne({ token, isActive: true, expiresAt: { $gt: new Date() } });
    if (!session) {
      res.status(401).json({ success: false, error: 'Session expired' });
      return;
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.isBlocked) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    req.user = {
      userId: user._id.toString(),
      websiteId: user.websiteId.toString(),
      role: user.role,
      email: user.email,
    };
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export const requireAdmin = requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN);
export const requireSuperAdmin = requireRole(USER_ROLES.SUPER_ADMIN);

export async function validateApiKey(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = (req.headers['x-api-key'] as string) || req.query.apiKey;
    if (!apiKey) {
      res.status(401).json({ success: false, error: 'API key required' });
      return;
    }

    const website = await Website.findOne({ apiKey, isActive: true });
    if (!website) {
      res.status(401).json({ success: false, error: 'Invalid API key' });
      return;
    }

    req.website = website;
    next();
  } catch {
    res.status(500).json({ success: false, error: 'API key validation failed' });
  }
}
