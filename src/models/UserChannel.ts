import mongoose, { Schema, Model } from 'mongoose';
import { IUserChannel } from '@/types';

const UserChannelSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true },
  lastRead: { type: Date },
  notificationsEnabled: { type: Boolean, default: true },
}, { timestamps: true });

UserChannelSchema.index({ userId: 1, channelId: 1 }, { unique: true });

const UserChannel: Model<IUserChannel> = 
  mongoose.models.UserChannel || mongoose.model<IUserChannel>('UserChannel', UserChannelSchema);

export default UserChannel;