import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAttachmentDocument extends Document {
  websiteId: Types.ObjectId;
  messageId?: Types.ObjectId;
  uploaderId: Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: Date;
}

const attachmentSchema = new Schema<IAttachmentDocument>(
  {
    websiteId: { type: Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
    messageId: { type: Schema.Types.ObjectId, ref: 'Message', index: true },
    uploaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Attachment = mongoose.model<IAttachmentDocument>('Attachment', attachmentSchema);
