import request from 'supertest';
import app from '../../src/app';
import { connectTestDB, clearTestDB, closeTestDB } from '../utils/dbHandler';

describe('Attempt Tracking & Struggle Detection Integration Test Suite', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // Helper to register a test user and extract session cookie
  const getAuthCookie = async (email: string, name = 'Test User'): Promise<string[]> => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name,
        email,
        password: 'password123!',
      });
    return (res.headers['set-cookie'] as unknown as string[]) || [];
  };

  // Helper to create a problem for a user
  const createTestProblem = async (cookie: string[], overrides = {}) => {
    const defaultProblem = {
      title: 'Valid Palindrome',
      description: 'Check if string is palindrome',
      topic: 'Strings',
      difficulty: 'Easy',
      platform: 'LeetCode',
      status: 'Not Started',
      estimatedTimeMinutes: 20,
      ...overrides,
    };

    const res = await request(app)
      .post('/api/problems')
      .set('Cookie', cookie)
      .send(defaultProblem);

    return res.body.problem;
  };

  describe('POST /api/problems/:id/attempts', () => {
    it('creates an attempt with auto-incremented attemptNumber and returns 201', async () => {
      const cookie = await getAuthCookie('user1@example.com');
      const problem = await createTestProblem(cookie);

      const response = await request(app)
        .post(`/api/problems/${problem._id}/attempts`)
        .set('Cookie', cookie)
        .send({
          result: 'Solved',
          timeTakenMinutes: 15,
          notes: 'Two pointer approach from both ends',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('attempt');
      expect(response.body.attempt).toMatchObject({
        problem: problem._id,
        attemptNumber: 1,
        result: 'Solved',
        timeTakenMinutes: 15,
        notes: 'Two pointer approach from both ends',
      });
      expect(response.body.problemStatus).toBe('Solved');
      expect(response.body.struggleStatus.isStruggle).toBe(false);

      // Log a second attempt to verify auto-increment
      const secondAttemptRes = await request(app)
        .post(`/api/problems/${problem._id}/attempts`)
        .set('Cookie', cookie)
        .send({
          result: 'Solved',
          timeTakenMinutes: 12,
          notes: 'Second practice run',
        });

      expect(secondAttemptRes.status).toBe(201);
      expect(secondAttemptRes.body.attempt.attemptNumber).toBe(2);
    });

    it('cascades status from Not Started to Attempted on failed attempt', async () => {
      const cookie = await getAuthCookie('user2@example.com');
      const problem = await createTestProblem(cookie, { status: 'Not Started' });

      const response = await request(app)
        .post(`/api/problems/${problem._id}/attempts`)
        .set('Cookie', cookie)
        .send({
          result: 'Failed',
          timeTakenMinutes: 30,
          notes: 'Got stuck on edge cases with non-alphanumeric chars',
        });

      expect(response.status).toBe(201);
      expect(response.body.problemStatus).toBe('Attempted');

      // Verify the problem itself is updated in DB
      const getProblemRes = await request(app)
        .get(`/api/problems/${problem._id}`)
        .set('Cookie', cookie);

      expect(getProblemRes.body.problem.status).toBe('Attempted');
      expect(getProblemRes.body.problem.lastPracticedAt).not.toBeNull();
    });

    it('rejects attempt creation when unauthenticated (401)', async () => {
      const cookie = await getAuthCookie('user3@example.com');
      const problem = await createTestProblem(cookie);

      const response = await request(app)
        .post(`/api/problems/${problem._id}/attempts`)
        .send({
          result: 'Solved',
          timeTakenMinutes: 15,
        });

      expect(response.status).toBe(401);
    });

    it('validates required fields: invalid result and non-positive duration (400)', async () => {
      const cookie = await getAuthCookie('user4@example.com');
      const problem = await createTestProblem(cookie);

      const invalidResultRes = await request(app)
        .post(`/api/problems/${problem._id}/attempts`)
        .set('Cookie', cookie)
        .send({
          result: 'InvalidStatus',
          timeTakenMinutes: 15,
        });

      expect(invalidResultRes.status).toBe(400);
      expect(invalidResultRes.body.details).toContain(
        'Result must be one of: Solved, Failed'
      );

      const invalidTimeRes = await request(app)
        .post(`/api/problems/${problem._id}/attempts`)
        .set('Cookie', cookie)
        .send({
          result: 'Solved',
          timeTakenMinutes: 0,
        });

      expect(invalidTimeRes.status).toBe(400);
      expect(invalidTimeRes.body.details).toContain(
        'Time taken must be at least 1 minute'
      );
    });

    it('prevents User B from logging an attempt for User A problem (404)', async () => {
      const cookieA = await getAuthCookie('userA@example.com', 'User A');
      const cookieB = await getAuthCookie('userB@example.com', 'User B');

      const problemA = await createTestProblem(cookieA);

      const response = await request(app)
        .post(`/api/problems/${problemA._id}/attempts`)
        .set('Cookie', cookieB)
        .send({
          result: 'Solved',
          timeTakenMinutes: 20,
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toMatch(/not found or unauthorized/i);
    });

    it('returns 400 for malformed ObjectId', async () => {
      const cookie = await getAuthCookie('user5@example.com');

      const response = await request(app)
        .post('/api/problems/invalid-object-id/attempts')
        .set('Cookie', cookie)
        .send({
          result: 'Solved',
          timeTakenMinutes: 20,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid problem ID format');
    });
  });

  describe('GET /api/problems/:id/attempts', () => {
    it('retrieves attempt history and flags struggle when failed attempts >= 3', async () => {
      const cookie = await getAuthCookie('user6@example.com');
      const problem = await createTestProblem(cookie);

      // Log 3 failed attempts
      for (let i = 1; i <= 3; i++) {
        await request(app)
          .post(`/api/problems/${problem._id}/attempts`)
          .set('Cookie', cookie)
          .send({
            result: 'Failed',
            timeTakenMinutes: 25,
            notes: `Attempt #${i} failed`,
          });
      }

      const response = await request(app)
        .get(`/api/problems/${problem._id}/attempts`)
        .set('Cookie', cookie);

      expect(response.status).toBe(200);
      expect(response.body.attempts).toHaveLength(3);
      // Verify descending order (latest attempt #3 first)
      expect(response.body.attempts[0].attemptNumber).toBe(3);
      expect(response.body.attempts[2].attemptNumber).toBe(1);

      // Verify struggle detection
      expect(response.body.struggleStatus.isStruggle).toBe(true);
      expect(response.body.struggleStatus.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining('3 failed attempts'),
        ])
      );
    });

    it('prevents User B from reading User A attempt history (404)', async () => {
      const cookieA = await getAuthCookie('userA2@example.com', 'User A');
      const cookieB = await getAuthCookie('userB2@example.com', 'User B');

      const problemA = await createTestProblem(cookieA);

      const response = await request(app)
        .get(`/api/problems/${problemA._id}/attempts`)
        .set('Cookie', cookieB);

      expect(response.status).toBe(404);
      expect(response.body.error).toMatch(/not found or unauthorized/i);
    });

    it('returns 400 for malformed ObjectId on GET', async () => {
      const cookie = await getAuthCookie('user7@example.com');

      const response = await request(app)
        .get('/api/problems/invalid-id/attempts')
        .set('Cookie', cookie);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid problem ID format');
    });
  });
});
