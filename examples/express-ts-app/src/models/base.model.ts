import mongoose, { Document, Schema } from 'mongoose';

export interface BaseModel extends Document {
  isActive: boolean;
  createdBy?: string | mongoose.Types.ObjectId;
  updatedBy?: string | mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const baseSchema = new Schema(
  {
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

baseSchema.index({ deletedAt: 1 }, { sparse: true });

// Methods
baseSchema.methods.toJSON = function (): object {
  const doc = this.toObject();
  delete doc.__v;
  return doc;
};

export const BaseModel = mongoose.model<BaseModel>('Base', baseSchema);
