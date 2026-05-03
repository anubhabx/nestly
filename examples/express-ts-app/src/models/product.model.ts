import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description?: string;
  price: number;
  category: string;
  brand?: string;
  sku?: string;
  stock: number;
  images: { url: string; alt?: string }[];
  rating: number;
  reviewCount: number;
  tags: string[];
  features: { title: string; value: string }[];
  specifications?: {
    weight?: string;
    dimensions?: string;
    material?: string;
    color?: string;
  };
  shippingWeight?: number;
  isFeatured: boolean;
  isActive: boolean;
  isInStock(): boolean;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Electronics',
        'Home & Garden',
        'Clothing',
        'Sports & Outdoors',
        'Books',
        'Toys & Games',
        'Health & Beauty',
        'Automotive',
        'Food & Grocery',
        'Other',
      ],
    },
    brand: {
      type: String,
      trim: true,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    images: [{
      url: String,
      alt: String,
    }],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    features: [{
      title: String,
      value: String,
    }],
    specifications: {
      weight: String,
      dimensions: String,
      material: String,
      color: String,
    },
    shippingWeight: Number,
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for availability status
productSchema.virtual('isInStock').get(function (): boolean {
  return this.stock > 0;
});

export const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);
