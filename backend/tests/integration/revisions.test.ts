import request from 'supertest';
import app from '../../src/app';
import { connectTestDB, clearTestDB, closeTestDB } from '../utils/dbHandler';
import { Revision } from '../../src/models/Revision';

describe('Spaced Revision System Integration Test Suite', () => {
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
      title: 'Invert Binary Tree',
      description: 'Invert a binary tree recursively or iteratively',
      topic: 'Trees',
      difficulty: 'Easy',
      platform: 'LeetCode',
      status: 'Solved',
      estimatedTimeMinutes: 15,
      ...overrides,
    };

    const res = await request(app)
      .post('/api/problems')
      .set('Cookie', cookie)
      .send(defaultProblem);

    return res.body.problem;
  };

  describe('GET /api/revisions/today', () => {
    it('returns revisions scheduled on or before today and excludes future ones', async () => {
      const cookie = await getAuthCookie('revuser1@example.com');
      const problem1 = await createTestProblem(cookie, { title: 'Problem Due Today' });
      const problem2 = await createTestProblem(cookie, { title: 'Problem Due Next Week' });

      // Create a revision due today (or overdue)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await request(app)
        .post('/api/revisions')
        .set('Cookie', cookie)
        .send({
          problemId: problem1._id,
          intervalDays: 1,
          scheduledDate: yesterday.toISOString(),
        });

      // Create a revision scheduled in the future (7 days away)
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await request(app)
        .post('/api/revisions')
        .set('Cookie', cookie)
        .send({
          problemId: problem2._id,
          intervalDays: 7,
          scheduledDate: nextWeek.toISOString(),
        });

      const response = await request(app)
        .get('/api/revisions/today')
        .set('Cookie', cookie);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(response.body.revisions).toHaveLength(1);
      expect(response.body.revisions[0].problem.title).toBe('Problem Due Today');
    });

    it('excludes completed revisions from today due list', async () => {
      const cookie = await getAuthCookie('revuser2@example.com');
      const problem = await createTestProblem(cookie);

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const createRes = await request(app)
        .post('/api/revisions')
        .set('Cookie', cookie)
        .send({
          problemId: problem._id,
          intervalDays: 1,
          scheduledDate: yesterday.toISOString(),
        });

      const revId = createRes.body.revision._id;

      // Complete this revision
      await request(app)
        .put(`/api/revisions/${revId}/complete`)
        .set('Cookie', cookie);

      // Verify it is no longer due today
      const todayRes = await request(app)
        .get('/api/revisions/today')
        .set('Cookie', cookie);

      expect(todayRes.status).toBe(200);
      expect(todayRes.body.count).toBe(0);
    });

    it('rejects unauthenticated request (401)', async () => {
      const response = await request(app).get('/api/revisions/today');
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/revisions/:id/complete and Leitner Progression (1d -> 7d -> 30d -> Mastered)', () => {
    it('completing 1-day revision auto-schedules 7-day revision', async () => {
      const cookie = await getAuthCookie('leitner1@example.com');
      const problem = await createTestProblem(cookie);

      const createRes = await request(app)
        .post('/api/revisions')
        .set('Cookie', cookie)
        .send({
          problemId: problem._id,
          intervalDays: 1,
        });

      const day1RevId = createRes.body.revision._id;

      const completeRes = await request(app)
        .put(`/api/revisions/${day1RevId}/complete`)
        .set('Cookie', cookie);

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.completedRevision.completed).toBe(true);
      expect(completeRes.body.nextRevision).not.toBeNull();
      expect(completeRes.body.nextRevision.intervalDays).toBe(7);
      expect(completeRes.body.mastered).toBe(false);

      // Verify the new 7-day revision exists in DB
      const allRevs = await Revision.find({ problem: problem._id });
      expect(allRevs).toHaveLength(2);
      expect(allRevs.some((r) => r.intervalDays === 7 && !r.completed)).toBe(true);
    });

    it('completing 7-day revision auto-schedules 30-day revision', async () => {
      const cookie = await getAuthCookie('leitner2@example.com');
      const problem = await createTestProblem(cookie);

      // Create a 7-day revision directly
      const createRes = await request(app)
        .post('/api/revisions')
        .set('Cookie', cookie)
        .send({
          problemId: problem._id,
          intervalDays: 7,
        });

      const day7RevId = createRes.body.revision._id;

      const completeRes = await request(app)
        .put(`/api/revisions/${day7RevId}/complete`)
        .set('Cookie', cookie);

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.nextRevision).not.toBeNull();
      expect(completeRes.body.nextRevision.intervalDays).toBe(30);
      expect(completeRes.body.mastered).toBe(false);
    });

    it('completing 30-day revision advances problem to Mastered', async () => {
      const cookie = await getAuthCookie('leitner3@example.com');
      const problem = await createTestProblem(cookie, { status: 'Solved' });

      // Create a 30-day revision
      const createRes = await request(app)
        .post('/api/revisions')
        .set('Cookie', cookie)
        .send({
          problemId: problem._id,
          intervalDays: 30,
        });

      const day30RevId = createRes.body.revision._id;

      const completeRes = await request(app)
        .put(`/api/revisions/${day30RevId}/complete`)
        .set('Cookie', cookie);

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.nextRevision).toBeNull();
      expect(completeRes.body.mastered).toBe(true);
      expect(completeRes.body.message).toMatch(/marked as Mastered/i);

      // Verify problem status in DB is now 'Mastered'
      const probRes = await request(app)
        .get(`/api/problems/${problem._id}`)
        .set('Cookie', cookie);

      expect(probRes.body.problem.status).toBe('Mastered');
    });

    it('prevents User B from completing User A revision (404)', async () => {
      const cookieA = await getAuthCookie('userA_rev@example.com');
      const cookieB = await getAuthCookie('userB_rev@example.com');

      const problemA = await createTestProblem(cookieA);

      const createRes = await request(app)
        .post('/api/revisions')
        .set('Cookie', cookieA)
        .send({
          problemId: problemA._id,
          intervalDays: 1,
        });

      const revId = createRes.body.revision._id;

      const completeRes = await request(app)
        .put(`/api/revisions/${revId}/complete`)
        .set('Cookie', cookieB);

      expect(completeRes.status).toBe(404);
      expect(completeRes.body.error).toMatch(/not found or unauthorized/i);
    });
  });

  describe('Auto-scheduling on Solved Attempt', () => {
    it('automatically schedules initial Day 1 revision when an attempt is Solved', async () => {
      const cookie = await getAuthCookie('autosched@example.com');
      const problem = await createTestProblem(cookie, { status: 'Not Started' });

      // Log a solved attempt
      const attemptRes = await request(app)
        .post(`/api/problems/${problem._id}/attempts`)
        .set('Cookie', cookie)
        .send({
          result: 'Solved',
          timeTakenMinutes: 20,
          notes: 'Solved on first try',
        });

      expect(attemptRes.status).toBe(201);

      // Verify a revision was auto-created
      const revRes = await request(app)
        .get('/api/revisions')
        .set('Cookie', cookie);

      expect(revRes.status).toBe(200);
      expect(revRes.body.count).toBe(1);
      expect(revRes.body.revisions[0].intervalDays).toBe(1);
      expect(revRes.body.revisions[0].completed).toBe(false);
    });
  });
});
