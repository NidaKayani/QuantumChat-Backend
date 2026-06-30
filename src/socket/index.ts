import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SOCKET_EVENTS } from '@quantum-chat/shared';
import { config } from '../config';
import { logger } from '../config/logger';
import { User, Website } from '../models';
import { MessageService, UserService, ConversationService } from '../services';
import type { AuthPayload } from '../middleware/auth';

interface SocketData {
  userId: string;
  websiteId: string;
  role: string;
}

const typingUsers = new Map<string, Set<string>>();

export function initSocketIO(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
      const user = await User.findById(decoded.userId);
      if (!user || user.isBlocked) return next(new Error('Access denied'));

      socket.data = {
        userId: user._id.toString(),
        websiteId: user.websiteId.toString(),
        role: user.role,
      } as SocketData;

      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { userId, websiteId } = socket.data as SocketData;
    logger.debug(`Socket connected: ${userId}`);

    socket.join(`website:${websiteId}`);
    socket.join(`user:${userId}`);

    handlePresence(io, socket, userId, websiteId);

    socket.on(SOCKET_EVENTS.CONVERSATION_JOIN, (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on(SOCKET_EVENTS.CONVERSATION_LEAVE, (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (payload, callback) => {
      try {
        const message = await MessageService.send(
          websiteId,
          payload.conversationId,
          userId,
          payload.content,
          payload.replyTo,
          payload.attachmentIds
        );

        io.to(`conversation:${payload.conversationId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, message);
        io.to(`website:${websiteId}`).emit(SOCKET_EVENTS.CONVERSATION_UPDATED, {
          conversationId: payload.conversationId,
        });

        const unreadCount = await ConversationService.getUnreadTotal(userId);
        socket.emit(SOCKET_EVENTS.UNREAD_COUNT, { count: unreadCount });

        callback?.({ success: true, data: message });
      } catch (err) {
        callback?.({ success: false, error: (err as Error).message });
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGE_EDIT, async (payload, callback) => {
      try {
        const message = await MessageService.edit(payload.messageId, userId, payload.content);
        io.to(`conversation:${payload.conversationId}`).emit(SOCKET_EVENTS.MESSAGE_EDITED, message);
        callback?.({ success: true, data: message });
      } catch (err) {
        callback?.({ success: false, error: (err as Error).message });
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGE_DELETE, async (payload, callback) => {
      try {
        const message = await MessageService.delete(payload.messageId, userId, socket.data.role);
        io.to(`conversation:${payload.conversationId}`).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
          messageId: payload.messageId,
          conversationId: payload.conversationId,
        });
        callback?.({ success: true, data: message });
      } catch (err) {
        callback?.({ success: false, error: (err as Error).message });
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGE_REACT, async (payload, callback) => {
      try {
        const message = await MessageService.react(payload.messageId, userId, payload.emoji);
        io.to(`conversation:${payload.conversationId}`).emit(SOCKET_EVENTS.MESSAGE_REACTED, message);
        callback?.({ success: true, data: message });
      } catch (err) {
        callback?.({ success: false, error: (err as Error).message });
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGE_READ, async (payload) => {
      try {
        await MessageService.markRead(payload.conversationId, userId, payload.messageIds);
        io.to(`conversation:${payload.conversationId}`).emit(SOCKET_EVENTS.MESSAGE_STATUS, {
          conversationId: payload.conversationId,
          readerId: userId,
          messageIds: payload.messageIds,
          status: 'read',
        });

        const unreadCount = await ConversationService.getUnreadTotal(userId);
        socket.emit(SOCKET_EVENTS.UNREAD_COUNT, { count: unreadCount });
      } catch (err) {
        logger.error('Mark read error:', err);
      }
    });

    socket.on(SOCKET_EVENTS.TYPING_START, (conversationId: string) => {
      if (!typingUsers.has(conversationId)) typingUsers.set(conversationId, new Set());
      typingUsers.get(conversationId)!.add(userId);
      socket.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.TYPING_UPDATE, {
        conversationId,
        userId,
        isTyping: true,
      });
    });

    socket.on(SOCKET_EVENTS.TYPING_STOP, (conversationId: string) => {
      typingUsers.get(conversationId)?.delete(userId);
      socket.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.TYPING_UPDATE, {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    socket.on('disconnect', async () => {
      logger.debug(`Socket disconnected: ${userId}`);
      await UserService.updatePresence(userId, false);
      io.to(`website:${websiteId}`).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
        userId,
        isOnline: false,
        lastSeenAt: new Date(),
      });

      typingUsers.forEach((users, convId) => {
        if (users.delete(userId)) {
          socket.to(`conversation:${convId}`).emit(SOCKET_EVENTS.TYPING_UPDATE, {
            conversationId: convId,
            userId,
            isTyping: false,
          });
        }
      });
    });
  });

  return io;
}

async function handlePresence(
  io: Server,
  socket: Socket,
  userId: string,
  websiteId: string
): Promise<void> {
  await UserService.updatePresence(userId, true);
  io.to(`website:${websiteId}`).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
    userId,
    isOnline: true,
  });

  const onlineUsers = await User.find({ websiteId, isOnline: true }).select('_id isOnline lastSeenAt');
  socket.emit(SOCKET_EVENTS.PRESENCE_BULK, onlineUsers);

  const unreadCount = await ConversationService.getUnreadTotal(userId);
  socket.emit(SOCKET_EVENTS.UNREAD_COUNT, { count: unreadCount });
}

