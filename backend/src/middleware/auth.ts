import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/token';
import { User } from '../models/User';

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No authentication token provided' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User no longer exists' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }
};
