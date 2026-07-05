import { Router } from 'express';
import {
  AuthController,
  authValidators,
  WebsiteController,
  UserController,
  ConversationController,
  MessageController,
  AttachmentController,
  NotificationController,
} from '../controllers';
import { authenticate, validateApiKey, requireAdmin, blockAdminFromMessaging } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter, uploadLimiter } from '../middleware/rateLimiter';
import { upload } from '../utils/upload';
import { body } from 'express-validator';

const router = Router();

// Public / API key routes
router.get('/websites/config', validateApiKey, WebsiteController.publicConfig);
router.post('/auth/widget', validateApiKey, authLimiter, validate(authValidators.widget), AuthController.widgetAuth);
router.post('/auth/register', validateApiKey, authLimiter, validate(authValidators.register), AuthController.register);
router.get('/auth/google/config', AuthController.googleConfig);
router.post('/auth/google', validateApiKey, authLimiter, validate(authValidators.google), AuthController.googleAuth);
router.post('/auth/login', authLimiter, validate(authValidators.login), AuthController.login);
router.post('/auth/admin/login', authLimiter, validate(authValidators.login), AuthController.adminLogin);

// Authenticated routes
router.use(authenticate);

router.get('/auth/me', AuthController.me);
router.patch('/auth/profile', validate(authValidators.profile), AuthController.updateProfile);
router.post('/auth/logout', AuthController.logout);

// Messaging is for end users only — admins are blocked (privacy requirement)
router.get('/conversations', blockAdminFromMessaging, ConversationController.list);
router.post('/conversations', blockAdminFromMessaging, body('participantId').isMongoId(), validate([body('participantId')]), ConversationController.create);
router.get('/conversations/search', blockAdminFromMessaging, ConversationController.search);
router.get('/conversations/unread', blockAdminFromMessaging, ConversationController.unreadCount);

router.get('/conversations/:conversationId/messages', blockAdminFromMessaging, MessageController.list);
router.post('/messages', blockAdminFromMessaging, MessageController.send);
router.patch('/messages/:id', blockAdminFromMessaging, MessageController.edit);
router.delete('/messages/:id', blockAdminFromMessaging, MessageController.delete);
router.post('/messages/:id/react', blockAdminFromMessaging, body('emoji').isString(), validate([body('emoji')]), MessageController.react);
router.post('/conversations/:conversationId/read', blockAdminFromMessaging, MessageController.markRead);

router.get('/users/search', blockAdminFromMessaging, UserController.search);

router.post('/attachments', blockAdminFromMessaging, uploadLimiter, upload.single('file'), AttachmentController.upload);

router.get('/notifications', blockAdminFromMessaging, NotificationController.list);
router.patch('/notifications/:id/read', blockAdminFromMessaging, NotificationController.markRead);
router.post('/notifications/read-all', blockAdminFromMessaging, NotificationController.markAllRead);

// Admin routes — analytics, sites, and user management only (no message content)
router.get('/admin/websites', requireAdmin, WebsiteController.list);
router.post('/admin/websites', requireAdmin, WebsiteController.create);
router.get('/admin/websites/:id', requireAdmin, WebsiteController.get);
router.patch('/admin/websites/:id', requireAdmin, WebsiteController.update);
router.post('/admin/websites/:id/verify', requireAdmin, WebsiteController.verify);
router.post('/admin/websites/:id/regenerate-key', requireAdmin, WebsiteController.regenerateKey);
router.get('/admin/websites/:id/analytics', requireAdmin, WebsiteController.analytics);

router.get('/admin/users', requireAdmin, UserController.list);
router.patch('/admin/users/:id/block', requireAdmin, UserController.block);

export default router;
