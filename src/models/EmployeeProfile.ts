import mongoose, { Schema, Model } from 'mongoose';
import { IEmployeeProfile } from '@/types';

const EmergencyContactSchema = new Schema({
  name: { type: String, required: true },
  relationship: { type: String, required: true },
  phone: { type: String, required: true }
});

const EmployeeProfileSchema: Schema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  employeeId: { 
    type: String, 
    required: true,
    unique: true 
  },
  department: { type: String, required: true },
  position: { type: String, required: true },
  hireDate: { type: Date, required: true },
  salary: { type: Number },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'intern'],
    default: 'full-time'
  },
  manager: { type: Schema.Types.ObjectId, ref: 'User' },
  skills: [{ type: String }],
  emergencyContacts: [EmergencyContactSchema]
}, { timestamps: true });

// Indexes
EmployeeProfileSchema.index({ employeeId: 1 });
EmployeeProfileSchema.index({ department: 1 });
EmployeeProfileSchema.index({ position: 1 });
EmployeeProfileSchema.index({ userId: 1 });

const EmployeeProfile: Model<IEmployeeProfile> = 
  mongoose.models.EmployeeProfile || 
  mongoose.model<IEmployeeProfile>('EmployeeProfile', EmployeeProfileSchema);

export default EmployeeProfile;