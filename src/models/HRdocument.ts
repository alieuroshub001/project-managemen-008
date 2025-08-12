import mongoose, { Schema, Model } from 'mongoose';
import { IHRDocument } from '@/types';

const HRDocumentSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: {
    type: String,
    enum: ['policy', 'contract', 'form', 'guide', 'other'],
    required: true
  },
  file: {
    public_id: { type: String, required: true },
    secure_url: { type: String, required: true },
    original_filename: { type: String, required: true },
    format: { type: String, required: true },
    bytes: { type: Number, required: true },
    type: { 
      type: String, 
      enum: ['image', 'video', 'audio', 'document'], 
      required: true 
    },
    resource_type: { type: String, required: true }
  },
  accessibleTo: [{ 
    type: String, 
    enum: ['superadmin', 'admin', 'hr', 'employee', 'client'] 
  }],
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { timestamps: true });

// Indexes
HRDocumentSchema.index({ title: 'text', description: 'text' });
HRDocumentSchema.index({ category: 1 });
HRDocumentSchema.index({ createdBy: 1 });

const HRDocument: Model<IHRDocument> = 
  mongoose.models.HRDocument || 
  mongoose.model<IHRDocument>('HRDocument', HRDocumentSchema);

export default HRDocument;