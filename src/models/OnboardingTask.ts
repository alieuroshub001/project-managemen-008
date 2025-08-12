import mongoose, { Schema, Model } from 'mongoose';
import { IOnboardingTask } from '@/types';

const OnboardingTaskSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  assignedTo: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  dueDate: { type: Date },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  employeeId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { timestamps: true });

// Indexes
OnboardingTaskSchema.index({ employeeId: 1 });
OnboardingTaskSchema.index({ assignedTo: 1 });
OnboardingTaskSchema.index({ completed: 1 });

const OnboardingTask: Model<IOnboardingTask> = 
  mongoose.models.OnboardingTask || 
  mongoose.model<IOnboardingTask>('OnboardingTask', OnboardingTaskSchema);

export default OnboardingTask;