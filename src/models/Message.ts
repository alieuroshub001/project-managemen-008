// models/Message.ts - Updated with attachment schema
import mongoose, { Schema, Model } from 'mongoose';
import { IMessage } from '@/types';

const AttachmentSchema: Schema = new Schema({
  public_id: { type: String, required: true },
  secure_url: { type: String, required: true },
  original_filename: { type: String, required: true },
  format: { type: String, required: true },
  bytes: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['image', 'video', 'audio', 'document'], 
    required: true 
  },
  resource_type: { type: String, required: true }
});

const MessageSchema: Schema = new Schema({
  content: { type: String, required: false }, // Made optional since we can have attachment-only messages
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true },
  attachments: [AttachmentSchema], // Array of attachment objects
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Validation to ensure either content or attachments exist
MessageSchema.pre('save', function(next) {
  if (!this.content && (!this.attachments || this.attachments.length === 0)) {
    next(new Error('Message must have either content or attachments'));
  } else {
    next();
  }
});

MessageSchema.index({ channelId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ 'attachments.type': 1 }); // Index for media queries

const Message: Model<IMessage> = 
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;