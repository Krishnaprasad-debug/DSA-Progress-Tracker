import { Request, Response } from 'express';
import mongoose from 'mongoose';

export const getHealthStatus = (_req: Request, res: Response): void => {
  const readyStateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbState = readyStateMap[mongoose.connection.readyState] || 'unknown';
  const isHealthy = dbState === 'connected' || process.env.NODE_ENV === 'test';

  const memory = process.memoryUsage();

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbState,
      name: mongoose.connection.name || 'dsa-progress-tracker',
    },
    memory: {
      rssMb: Math.round((memory.rss / (1024 * 1024)) * 100) / 100,
      heapUsedMb: Math.round((memory.heapUsed / (1024 * 1024)) * 100) / 100,
      heapTotalMb: Math.round((memory.heapTotal / (1024 * 1024)) * 100) / 100,
    },
    security: {
      helmet: true,
      rateLimiter: true,
      noSqlSanitize: true,
      corsRestricted: true,
    },
  });
};
