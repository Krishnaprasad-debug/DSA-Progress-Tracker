import rateLimit, { RateLimitRequestHandler, Options } from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Standard error response structure for rate limit exceeded events
 */
const createRateLimitHandler = (errorMessage: string) => {
  return (_req: Request, res: Response): void => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: errorMessage,
      retryAfterSeconds: Math.ceil(15 * 60),
    });
  };
};

/**
 * Global rate limiter: restricts IP addresses to 100 requests per 15 minutes.
 */
export const generalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 5 : 100, // 5 for test assertions, 100 in production
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many requests from this IP. Please try again after 15 minutes.'),
  skip: (req: Request) => {
    // In test environment, skip unless explicitly testing rate limits
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return true;
    }
    return false;
  },
});

/**
 * Auth rate limiter: restricts sensitive auth endpoints (login, register)
 * to 10 requests per 15 minutes to prevent brute-force attacks.
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 3 : 10, // 3 for test assertions, 10 in production
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many authentication attempts from this IP. Please try again after 15 minutes.'),
  skip: (req: Request) => {
    // In test environment, skip unless explicitly testing rate limits
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return true;
    }
    return false;
  },
});

/**
 * Configurable rate limiter factory for testing or bespoke limits
 */
export const createLimiter = (options: Partial<Options>): RateLimitRequestHandler => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });
};
