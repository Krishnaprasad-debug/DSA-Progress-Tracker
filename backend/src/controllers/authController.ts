import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken, sendTokenCookie, clearTokenCookie } from '../utils/token';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(409).json({ error: 'Conflict: Email is already registered' });
      return;
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    const token = generateToken({ id: user._id.toString(), email: user.email });
    sendTokenCookie(res, token);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Explicitly include password for verification since schema has select: false
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: Invalid email or password' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Unauthorized: Invalid email or password' });
      return;
    }

    const token = generateToken({ id: user._id.toString(), email: user.email });
    sendTokenCookie(res, token);

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  clearTokenCookie(res);
  res.status(200).json({ message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    return;
  }

  res.status(200).json({
    user: {
      id: req.user._id.toString(),
      name: req.user.name,
      email: req.user.email,
    },
  });
};
