import { Request, NextFunction } from 'express';
import { Product } from '../models/product.model.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { validate } from '../middleware/validation.js';
import { body } from 'express-validator';

export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Search and filter
    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';
    const priceMin = parseFloat(req.query.priceMin as string) || 0;
    const priceMax = parseFloat(req.query.priceMax as string) || Infinity;
    const inStock = req.query.inStock;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;

    // Build query
    const queryObj: any = { isActive: true };

    if (search) {
      queryObj.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    if (category) {
      queryObj.category = category;
    }

    queryObj.price = {
      $gte: priceMin,
      $lte: priceMax,
    };

    if (inStock !== undefined) {
      queryObj.stock = { $gt: 0 };
    }

    const [products, total] = await Promise.all([
      Product.find(queryObj)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(queryObj),
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await Product.find({
      isFeatured: true,
      isActive: true,
    }).limit(12);

    res.json({
      success: true,
      data: { products },
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request & { user?: { _id: string } }, res: Response, next: NextFunction) => {
  try {
    const product = await Product.create(req.body);

    logger.info(`Product created: ${product.name} by user ${req.user?._id}`);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request & { user?: { _id: string } }, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user?._id || undefined },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    logger.info(`Product ${req.params.id} updated`);

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Soft delete
    product.deletedAt = new Date();
    product.isActive = false;
    await product.save();

    logger.info(`Product ${req.params.id} soft deleted`);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Define validators
export const authValidators = {
  login: [
    body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  register: [
    body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    validate,
  ],
};

export const productValidators = {
  create: [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').notEmpty().withMessage('Category is required'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    validate,
  ],
  update: [
    body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').optional().notEmpty().withMessage('Category is required'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    validate,
  ],
};
