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
  url: any;
  name: any;
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

// Add to types/index.ts
export interface IProject {
  id: string;
  name: string;
  description?: string;
  status: 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate?: Date;
  dueDate?: Date;
  createdBy: string; // User ID
  teamMembers: Array<{
    userId: string;
    role: 'manager' | 'member' | 'viewer';
  }>;
  client?: string; // Client ID
  budget?: number;
  progress: number;
  attachments?: IAttachment[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask {
  id: string;
  title: string;
  description?: string;
  project: string; // Project ID
  status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: Date;
  assignedTo?: string; // User ID
  createdBy: string; // User ID
  completedAt?: Date;
  estimatedHours?: number;
  actualHours: number;
  dependencies?: string[]; // Task IDs
  attachments?: IAttachment[];
  comments?: Array<{
    content: string;
    user: string; // User ID
    createdAt: Date;
  }>;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectWithStats extends IProject {
  taskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
  teamMemberDetails: Array<{
    userId: string;
    name: string;
    email: string;
    role: 'manager' | 'member' | 'viewer';
    taskCount: number;
  }>;
}

// Add to types/index.ts

// HR Types
export interface IEmployeeProfile {
  userId: string; // Reference to User
  employeeId: string; // Company employee ID
  department: string;
  position: string;
  hireDate: Date;
  salary?: number;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'intern';
  manager?: string; // User ID of manager
  skills?: string[];
  emergencyContacts?: Array<{
    name: string;
    relationship: string;
    phone: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeaveRequest {
  _id: any;
  id: string;
  employeeId: string; // User ID
  type: 'vacation' | 'sick' | 'personal' | 'bereavement' | 'other';
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy?: string; // User ID of approver
  reviewedAt?: Date;
  attachments?: IAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceRecord {
  id: string;
  employeeId: string; // User ID
  date: Date;
  checkIn: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'on-leave';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHRDocument {
  id: string;
  title: string;
  description?: string;
  category: 'policy' | 'contract' | 'form' | 'guide' | 'other';
  file: IAttachment;
  accessibleTo: UserRole[]; // Which roles can access this document
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

export interface IOnboardingTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // User ID (HR or manager)
  dueDate?: Date;
  completed: boolean;
  completedAt?: Date;
  employeeId: string; // User ID of new employee
  createdAt: Date;
  updatedAt: Date;
}