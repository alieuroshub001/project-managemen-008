import mongoose, { Schema, Model } from 'mongoose';
import { IMessage } from '@/types';

const MessageSchema: Schema = new Schema({
  content: { type: String, required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true },
  attachments: [{ type: String }],
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

MessageSchema.index({ channelId: 1, createdAt: -1 });

const Message: Model<IMessage> = 
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;