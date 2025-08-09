import mongoose, { Schema, Model, ValidatorProps } from 'mongoose';
import { IUserWithPassword } from '@/types';

const UserSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true, // Keep only this unique index
    trim: true,
    lowercase: true,
    validate: {
      validator: (v: string) => /\S+@\S+\.\S+/.test(v),
      message: (props: ValidatorProps) => `${props.value} is not a valid email!`
    }
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'], 
    select: false,
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'hr', 'employee', 'client'],
    default: 'employee',
    required: true
  },
  emailVerified: { 
    type: Boolean, 
    default: false 
  },
  verificationToken: { 
    type: String,
    select: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Remove this duplicate index - keeping only the one in schema definition
// UserSchema.index({ email: 1 }, { unique: true }); 

// Keep role index
UserSchema.index({ role: 1 });

UserSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const User: Model<IUserWithPassword> =
  mongoose.models.User || mongoose.model<IUserWithPassword>('User', UserSchema);

export default User;