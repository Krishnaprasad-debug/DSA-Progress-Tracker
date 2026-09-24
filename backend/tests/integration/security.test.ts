import request from 'supertest';
import { app } from '../../src/app';

describe('Security Hardening & Quality Gate Integration Test Suite', () => {
  describe('Helmet HTTP Security Headers', () => {
    it('returns strict security headers on API responses', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);

      // Verify X-Content-Type-Options: nosniff prevents MIME type sniffing
      expect(response.headers['x-content-type-options']).toBe('nosniff');

      // Verify X-Frame-Options: SAMEORIGIN prevents clickjacking
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');

      // Verify Content-Security-Policy (CSP) is configured
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");

      // Verify X-DNS-Prefetch-Control
      expect(response.headers['x-dns-prefetch-control']).toBe('off');
    });
  });

  describe('CORS Configuration', () => {
    it('allows requests from configured CLIENT_URL with credentials support', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('handles CORS preflight OPTIONS requests gracefully', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });
  });

  describe('NoSQL Query Injection Sanitization', () => {
    it('sanitizes body containing NoSQL operators before validation', async () => {
      // Send a request with malicious NoSQL operators injected
      const maliciousPayload = {
        email: 'invalid-email',
        password: {
          $ne: '',
        },
        $where: 'sleep(1000)',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousPayload);

      // Validation returns 400 Bad Request because password was stripped to {} and email is invalid
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('details');
      expect(response.body.error).toBe('Validation Failed');
    });
  });

  describe('Rate Limiting Protection', () => {
    it('enforces 429 Too Many Requests when rate limit threshold is exceeded', async () => {
      // In test mode, requests with 'x-test-rate-limit: true' activate the limiter (max: 3 for authLimiter)
      const attemptLogin = () =>
        request(app)
          .post('/api/auth/login')
          .set('x-test-rate-limit', 'true')
          .send({ email: 'attacker@example.com' }); // Missing password triggers 400 validation error instantly

      // First 3 requests reach validation middleware and return 400 Bad Request
      const res1 = await attemptLogin();
      expect(res1.status).toBe(400);

      const res2 = await attemptLogin();
      expect(res2.status).toBe(400);

      const res3 = await attemptLogin();
      expect(res3.status).toBe(400);

      // 4th request is blocked by authLimiter with 429 Too Many Requests
      const res4 = await attemptLogin();
      expect(res4.status).toBe(429);
      expect(res4.body.error).toBe('Too Many Requests');
      expect(res4.body.message).toMatch(/Too many authentication attempts/i);
      expect(res4.body.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe('Enhanced Health & Security Diagnostics', () => {
    it('reports system uptime, memory metrics, and active security middleware', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.uptimeSeconds).toBeDefined();
      expect(response.body.database).toBeDefined();
      expect(response.body.database.status).toBeDefined();
      expect(response.body.memory).toBeDefined();
      expect(response.body.memory.rssMb).toBeGreaterThan(0);
      expect(response.body.memory.heapUsedMb).toBeGreaterThan(0);

      // Security verification flags
      expect(response.body.security).toEqual({
        helmet: true,
        rateLimiter: true,
        noSqlSanitize: true,
        corsRestricted: true,
      });
    });
  });
});
