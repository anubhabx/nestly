import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  getCurrentUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

// Public routes
router.use(optionalAuth);

// Get all users
router.get(protect, getAllUsers);

// Get current user
router.get('/me', protect, getCurrentUser);

// Get user by ID
router.get('/:id', getUserById);

// Update user
router.put('/:id', protect, validate, updateUser);

// Delete user (admin only)
router.delete('/:id', protect, deleteUser);

export { router as userRouter };
