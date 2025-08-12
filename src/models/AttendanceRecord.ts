import mongoose, { Schema, Model } from 'mongoose';
import { IAttendanceRecord } from '@/types';

const AttendanceRecordSchema: Schema = new Schema({
  employeeId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { type: Date, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'on-leave'],
    default: 'present'
  },
  notes: { type: String }
}, { timestamps: true });

// Compound index for employee and date (one record per employee per day)
AttendanceRecordSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const AttendanceRecord: Model<IAttendanceRecord> = 
  mongoose.models.AttendanceRecord || 
  mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema);

export default AttendanceRecord;