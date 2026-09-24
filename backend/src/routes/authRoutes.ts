import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/authController';
import { validateRegister, validateLogin } from '../middleware/validate';
import { protect } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

export const authRouter: Router = Router();

authRouter.post('/register', authLimiter, validateRegister, register);
authRouter.post('/login', authLimiter, validateLogin, login);
authRouter.post('/logout', logout);
authRouter.get('/me', protect, getMe);

export default authRouter;
