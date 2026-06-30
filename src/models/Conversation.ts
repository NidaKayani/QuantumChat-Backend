import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IConversationDocument extends Document {
  websiteId: Types.ObjectId;
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  lastMessageAt?: Date;
  unreadCounts: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversationDocument>(
  {
    websiteId: { type: Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: { type: Date, index: true },
    unreadCounts: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
  },
  { timestamps: true }
);

conversationSchema.index({ websiteId: 1, participants: 1 });
conversationSchema.index({ websiteId: 1, lastMessageAt: -1 });

export const Conversation = mongoose.model<IConversationDocument>('Conversation', conversationSchema);
