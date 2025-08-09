// types/index.ts - Updated with media support
export type UserRole = 'superadmin' | 'admin' | 'hr' | 'employee' | 'client';

// User types
export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  verificationToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserWithPassword extends IUser {
  password: string;
}

// Auth session types
export interface ISessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface ISession {
  user: ISessionUser;
  expires: string;
}

// OTP and password reset types
export interface IOTP {
  id: string;
  email: string; // Email where OTP was sent
  otp: string;
  type: 'verification' | 'password-reset';
  referenceEmail?: string; // Original user email (for admin approval cases)
  expiresAt: Date;
  createdAt: Date;
}

export interface IPasswordResetToken {
  id: string;
  email: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// Media/Attachment types
export interface IAttachment {
  public_id: string;
  secure_url: string;
  original_filename: string;
  format: string;
  bytes: number;
  type: 'image' | 'video' | 'audio' | 'document';
  resource_type: string;
}

// Message types
export interface IMessage {
  id: string;
  content: string;
  sender: string; // User ID
  channelId: string;
  createdAt: Date;
  updatedAt: Date;
  attachments?: IAttachment[]; // Array of attachment objects
  readBy?: string[]; // Array of user IDs who read the message
}

export interface IChannel {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  createdBy: string; // User ID
  members: string[]; // Array of user IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserChannel {
  userId: string;
  channelId: string;
  lastRead?: Date;
  notificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API response type
export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}