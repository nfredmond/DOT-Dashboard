import mongoose, { Schema, Document } from "mongoose";

export interface ICommunityInput extends Document {
  type: string; // point, line, polygon
  geometry: any;
  title: string;
  description: string;
  category: string;
  username: string;
  userId: string;
  organizationId: string;
  images: string[];
  timestamp: Date;
  status: string; // pending, approved, rejected
  llmCategory?: string; // Auto-categorized by LLM
  moderatorId?: string; // ID of admin who approved/rejected
  moderationDate?: Date; // Date of moderation
  moderationNotes?: string; // Optional notes from moderator
}

const CommunityInputSchema: Schema = new Schema({
  type: { type: String, required: true, enum: ["point", "line", "polygon"] },
  geometry: { type: Schema.Types.Mixed, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  username: { type: String, required: true },
  userId: { type: String, required: true },
  organizationId: { type: String, required: true },
  images: [{ type: String }],
  timestamp: { type: Date, default: Date.now },
  status: { 
    type: String, 
    required: true, 
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  llmCategory: { type: String },
  moderatorId: { type: String },
  moderationDate: { type: Date },
  moderationNotes: { type: String }
});

// Create index for geospatial queries if geometry is stored in GeoJSON format
// This would require updating the geometry field to proper GeoJSON format
// CommunityInputSchema.index({ geometry: '2dsphere' });

// Create indexes for common queries
CommunityInputSchema.index({ status: 1 });
CommunityInputSchema.index({ organizationId: 1 });
CommunityInputSchema.index({ category: 1 });
CommunityInputSchema.index({ userId: 1 });

// Don't overwrite if model already exists (for hot reloading)
export default mongoose.models.CommunityInput || 
  mongoose.model<ICommunityInput>("CommunityInput", CommunityInputSchema); 