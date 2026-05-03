import mongoose from 'mongoose';

const baseSchema = new mongoose.Schema(
  {
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedAt: {
      type: Date,
      default: null,
      index: { sparse: true },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for soft delete pattern
baseSchema.index({ deletedAt: 1 }, { sparse: true, partialFilterExpression: { deletedAt: { $exists: true } } });

// Methods
baseSchema.methods.toJSON = function () {
  const doc = this.toObject();
  delete doc.__v;
  return doc;
};

export const BaseModel = mongoose.model('Base', baseSchema);
