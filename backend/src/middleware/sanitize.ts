import { Request, Response, NextFunction } from 'express';

/**
 * Recursively sanitizes an object or array by removing keys starting with '$' or containing '.'
 * to prevent NoSQL query injection attacks against MongoDB.
 */
export const sanitizeData = (data: unknown): unknown => {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  if (typeof data === 'object') {
    const cleanObj: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      // Reject or sanitize keys starting with '$' or containing '.'
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }
      cleanObj[key] = sanitizeData(value);
    }

    return cleanObj;
  }

  return data;
};

/**
 * Express middleware to sanitize req.body, req.query, and req.params against NoSQL injection.
 */
export const mongoSanitizeMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeData(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeData(req.query) as Request['query'];
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeData(req.params) as Request['params'];
  }

  next();
};

export default mongoSanitizeMiddleware;
