import request from 'supertest';
import app from '../../src/app';
import { connectTestDB, clearTestDB, closeTestDB } from '../utils/dbHandler';

describe('Analytics Engine Integration Test Suite', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  const getAuthCookie = async (email: string, name = 'Analytics User'): Promise<string[]> => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name,
        email,
        password: 'password123!',
      });
    return (res.headers['set-cookie'] as unknown as string[]) || [];
  };

  const createProblem = async (cookie: string[], topic: string, difficulty = 'Medium', status = 'Not Started') => {
    const res = await request(app)
      .post('/api/problems')
      .set('Cookie', cookie)
      .send({
        title: `Sample ${topic} Problem`,
        topic,
        difficulty,
        platform: 'LeetCode',
        status,
        estimatedTimeMinutes: 25,
      });
    return res.body.problem;
  };

  const logAttempt = async (cookie: string[], problemId: string, result: 'Solved' | 'Failed', timeTaken = 20) => {
    const res = await request(app)
      .post(`/api/problems/${problemId}/attempts`)
      .set('Cookie', cookie)
      .send({
        result,
        timeTakenMinutes: timeTaken,
        notes: 'Integration test attempt',
      });
    return res.body.attempt;
  };

  describe('GET /api/analytics/dashboard', () => {
    it('returns comprehensive dashboard metrics scoped to the authenticated user', async () => {
      const cookie = await getAuthCookie('dashuser@example.com');

      // Create 3 problems: 1 Easy (Solved), 1 Medium (Attempted), 1 Hard (Not Started)
      const p1 = await createProblem(cookie, 'Arrays', 'Easy', 'Not Started');
      const p2 = await createProblem(cookie, 'Dynamic Programming', 'Medium', 'Not Started');
      await createProblem(cookie, 'Graphs', 'Hard', 'Not Started');

      // Log attempts: p1 solved (20 mins), p2 failed (35 mins)
      await logAttempt(cookie, p1._id, 'Solved', 20);
      await logAttempt(cookie, p2._id, 'Failed', 35);

      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Cookie', cookie);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        totalProblems: 3,
        totalSolved: 1,
        totalAttempted: 1,
        totalAttempts: 2,
        totalSolvedAttempts: 1,
        overallSuccessRate: 50,
        totalPracticeTimeMinutes: 55,
        currentStreak: 1,
        activeToday: true,
      });

      expect(response.body.byDifficulty.Easy).toEqual({ total: 1, solved: 1 });
      expect(response.body.byDifficulty.Medium).toEqual({ total: 1, solved: 0 });
      expect(response.body.byDifficulty.Hard).toEqual({ total: 1, solved: 0 });
      expect(response.body.recentActivity).toHaveLength(2);
    });

    it('rejects unauthenticated request (401)', async () => {
      const response = await request(app).get('/api/analytics/dashboard');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/analytics/topics', () => {
    it('returns all 16 canonical DSA topics with accurate mastery scores and weak diagnostics', async () => {
      const cookie = await getAuthCookie('topicuser@example.com');

      // Create and fail 3 attempts in Dynamic Programming to trigger Weak Topic
      const dpProblem = await createProblem(cookie, 'Dynamic Programming', 'Hard');
      await logAttempt(cookie, dpProblem._id, 'Failed', 40);
      await logAttempt(cookie, dpProblem._id, 'Failed', 45);
      await logAttempt(cookie, dpProblem._id, 'Failed', 50);

      const response = await request(app)
        .get('/api/analytics/topics')
        .set('Cookie', cookie);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(16);
      expect(response.body.topics).toHaveLength(16);

      const dpTopic = response.body.topics.find((t: { topic: string }) => t.topic === 'Dynamic Programming');
      expect(dpTopic).toBeDefined();
      expect(dpTopic.totalProblems).toBe(1);
      expect(dpTopic.attemptCount).toBe(3);
      expect(dpTopic.successfulAttempts).toBe(0);
      expect(dpTopic.successRate).toBe(0);
      expect(dpTopic.isWeak).toBe(true);
      expect(dpTopic.weakReasons.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/analytics/streak', () => {
    it('returns streak statistics and daily activity frequency', async () => {
      const cookie = await getAuthCookie('streakuser@example.com');
      const prob = await createProblem(cookie, 'Trees');
      await logAttempt(cookie, prob._id, 'Solved', 15);

      const response = await request(app)
        .get('/api/analytics/streak')
        .set('Cookie', cookie);

      expect(response.status).toBe(200);
      expect(response.body.currentStreak).toBe(1);
      expect(response.body.longestStreak).toBe(1);
      expect(response.body.activeToday).toBe(true);
      expect(Object.keys(response.body.history).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Multi-tenant Isolation in Analytics', () => {
    it('does not leak User B metrics into User A analytics', async () => {
      const cookieA = await getAuthCookie('userA_analytics@example.com');
      const cookieB = await getAuthCookie('userB_analytics@example.com');

      // User B creates 5 problems and solves them
      const pB = await createProblem(cookieB, 'Greedy', 'Easy');
      await logAttempt(cookieB, pB._id, 'Solved', 20);

      // User A queries dashboard - should be zero
      const resA = await request(app)
        .get('/api/analytics/dashboard')
        .set('Cookie', cookieA);

      expect(resA.status).toBe(200);
      expect(resA.body.totalProblems).toBe(0);
      expect(resA.body.totalSolved).toBe(0);
      expect(resA.body.totalAttempts).toBe(0);
    });
  });
});
