import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/authController';
import { validateRegister, validateLogin } from '../middleware/validate';
import { protect } from '../middleware/auth';

export const authRouter: Router = Router();

authRouter.post('/register', validateRegister, register);
authRouter.post('/login', validateLogin, login);
authRouter.post('/logout', logout);
authRouter.get('/me', protect, getMe);

export default authRouter;
