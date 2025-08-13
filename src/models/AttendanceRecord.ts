import mongoose, { Schema, Model } from 'mongoose';
import { IAttendanceRecord } from '@/types';

const BreakSchema = new Schema({
  start: { type: Date, required: true },
  end: { type: Date },
});

const NamazSchema = new Schema({
  start: { type: Date, required: true },
  end: { type: Date },
});

const TaskSchema = new Schema({
  task: { type: String, required: true },
  description: { type: String },
  hoursSpent: { type: Number },
});

const AttendanceRecordSchema: Schema = new Schema(
  {
    employeeId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    date: { type: Date, required: true },
    shift: {
      type: String,
      enum: ['morning', 'evening', 'night'],
      required: true
    },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date },
    checkInReason: { type: String },
    checkOutReason: { type: String },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'on-leave'],
      default: 'present'
    },
    tasksCompleted: [TaskSchema],
    breaks: [BreakSchema],
    totalBreakMinutes: { type: Number, default: 0 },
    namaz: [NamazSchema],
    totalNamazMinutes: { type: Number, default: 0 },
    totalHours: { type: Number },
    notes: { type: String }
  },
  { 
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound index for employee and date (one record per employee per day)
AttendanceRecordSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const AttendanceRecord: Model<IAttendanceRecord> = 
  mongoose.models.AttendanceRecord || 
  mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema);

export default AttendanceRecord;
