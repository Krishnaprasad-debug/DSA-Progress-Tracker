import request from 'supertest';
import app from '../src/app';

describe('Backend Baseline CI Test Suite', () => {
  it('GET /api/health returns 200 and operational status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('GET /api/unknown-route returns 404', async () => {
    const response = await request(app).get('/api/non-existent');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Endpoint not found');
  });
});
