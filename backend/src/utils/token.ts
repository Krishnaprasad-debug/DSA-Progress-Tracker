import { Response } from 'express';
import jwt from 'jsonwebtoken';

export interface TokenPayload {
  id: string;
  email: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_min_32_characters_long_for_security';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (payload: TokenPayload): string => {
  const signOptions: jwt.SignOptions = {
    expiresIn: (JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, JWT_SECRET, signOptions);
};


export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const sendTokenCookie = (res: Response, token: string): void => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true, // Mitigates XSS - inaccessible to client-side JavaScript
    secure: isProduction, // Required over HTTPS in production; disabled for localhost HTTP dev
    sameSite: isProduction ? 'strict' : 'lax', // Strict CSRF protection in prod, lax in dev for cross-port
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  });
};

export const clearTokenCookie = (res: Response): void => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    expires: new Date(0),
    path: '/',
  });
};
