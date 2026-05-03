import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  me,
  authValidators,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/register', ...authValidators.register, register);
router.post('/login', ...authValidators.login, login);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', protect, me);

export { router as authRouter };
