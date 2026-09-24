import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { mongoSanitizeMiddleware } from './middleware/sanitize';
import { generalLimiter } from './middleware/rateLimiter';
import { getHealthStatus } from './controllers/healthController';

import authRouter from './routes/authRoutes';
import problemRouter from './routes/problemRoutes';
import revisionRouter from './routes/revisionRoutes';
import analyticsRouter from './routes/analyticsRoutes';
import goalRouter from './routes/goalRoutes';
import reportRouter from './routes/reportRoutes';
import assessmentRouter from './routes/assessmentRoutes';

dotenv.config();

export const app: Express = express();

const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Helmet Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", allowedOrigin],
        fontSrc: ["'self'", 'https:'],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Strict CORS Configuration
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-test-rate-limit'],
  })
);

// 3. Body Parser & Cookie Parser
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'dev_secret'));

// 4. NoSQL Query Injection Sanitization
app.use(mongoSanitizeMiddleware);

// 5. Global API Rate Limiter
app.use('/api', generalLimiter);

// 6. Enhanced Health Check Endpoint
app.get('/api/health', getHealthStatus);

// Domain Routes
app.use('/api/auth', authRouter);
app.use('/api/problems', problemRouter);
app.use('/api/revisions', revisionRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/goals', goalRouter);
app.use('/api/reports', reportRouter);
app.use('/api/assessments', assessmentRouter);



// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Centralized Error Handling Middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
});

export default app;
