import request from 'supertest';
import app from '../../src/app';
import { connectTestDB, clearTestDB, closeTestDB } from '../utils/dbHandler';

describe('Authentication Integration Test Suite', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  const validUser = {
    name: 'Ada Lovelace',
    email: 'ada.lovelace@example.com',
    password: 'securePassword123!',
  };

  describe('POST /api/auth/register', () => {
    it('successfully registers a new user, hashes password, and sets HttpOnly cookie', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        name: validUser.name,
        email: validUser.email,
      });
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).toHaveProperty('id');

      // Assert HttpOnly cookie is attached
      const cookies = (response.headers['set-cookie'] as unknown as string[]) || [];
      expect(cookies.length).toBeGreaterThan(0);
      const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie).toContain('HttpOnly');
    });

    it('rejects registration when email already exists (409 Conflict)', async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const duplicateResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Ada Duplicate',
          email: validUser.email.toUpperCase(), // Case-insensitive test
          password: 'anotherPassword123',
        });

      expect(duplicateResponse.status).toBe(409);
      expect(duplicateResponse.body).toHaveProperty('error');
    });

    it('returns 400 Bad Request when required fields are invalid or missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'not-an-email',
          password: '123', // Less than 6 characters
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Failed');
      expect(response.body.details.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser);
    });

    it('successfully logs in with valid credentials and attaches cookie', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(validUser.email);
      expect(response.body.user).not.toHaveProperty('password');

      const cookies = (response.headers['set-cookie'] as unknown as string[]) || [];
      expect(cookies.length).toBeGreaterThan(0);
      expect(cookies.some((c: string) => c.startsWith('token='))).toBe(true);
    });

    it('rejects login with incorrect password (401 Unauthorized)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: 'WrongPassword!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('rejects login with non-existent email (401 Unauthorized)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown.user@example.com',
          password: 'somePassword123',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('validates required fields on login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'bademail' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Failed');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user details when valid session cookie is provided', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      const cookie = registerRes.headers['set-cookie'];

      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookie);

      expect(meResponse.status).toBe(200);
      expect(meResponse.body).toHaveProperty('user');
      expect(meResponse.body.user.email).toBe(validUser.email);
      expect(meResponse.body.user.name).toBe(validUser.name);
    });

    it('returns 401 Unauthorized when unauthenticated', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('returns 401 Unauthorized when provided an invalid or tampered token cookie', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ['token=malformed_token_string; Path=/; HttpOnly']);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears session cookie on logout', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');

      const cookies = (response.headers['set-cookie'] as unknown as string[]) || [];
      expect(cookies.length).toBeGreaterThan(0);
      const tokenCookie = cookies.find((c: string) => c.startsWith('token=;'));
      expect(tokenCookie).toBeDefined();
    });
  });
});
