import mongoose, { Schema, Document, Types } from 'mongoose';
import { MESSAGE_STATUS } from '@quantum-chat/shared';
import type { MessageStatus } from '@quantum-chat/shared';

export interface IReaction {
  emoji: string;
  userId: Types.ObjectId;
}

export interface IMessageDocument extends Document {
  websiteId: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  replyTo?: Types.ObjectId;
  attachments: Types.ObjectId[];
  reactions: IReaction[];
  status: MessageStatus;
  readBy: Types.ObjectId[];
  isEdited: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reactionSchema = new Schema<IReaction>(
  {
    emoji: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false }
);

const messageSchema = new Schema<IMessageDocument>(
  {
    websiteId: { type: Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, default: '' },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    attachments: [{ type: Schema.Types.ObjectId, ref: 'Attachment' }],
    reactions: [reactionSchema],
    status: {
      type: String,
      enum: Object.values(MESSAGE_STATUS),
      default: MESSAGE_STATUS.SENT,
    },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ websiteId: 1, content: 'text' });

export const Message = mongoose.model<IMessageDocument>('Message', messageSchema);
