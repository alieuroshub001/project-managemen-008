import mongoose, { Schema, Model } from 'mongoose';
import { IChannel } from '@/types';

const ChannelSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  isPrivate: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

ChannelSchema.index({ name: 'text', description: 'text' });
ChannelSchema.index({ isPrivate: 1 });
ChannelSchema.index({ members: 1 });

const Channel: Model<IChannel> = 
  mongoose.models.Channel || mongoose.model<IChannel>('Channel', ChannelSchema);

export default Channel;