import request from 'supertest';
import app from '../../src/app';
import { connectTestDB, clearTestDB, closeTestDB } from '../utils/dbHandler';

describe('Assessment Engine Integration Test Suite', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  const getAuthCookie = async (email: string, name = 'Contest User'): Promise<string[]> => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name,
        email,
        password: 'password123!',
      });
    return (res.headers['set-cookie'] as unknown as string[]) || [];
  };

  const createProblem = async (
    cookie: string[],
    title: string,
    difficulty = 'Medium',
    topic = 'Arrays'
  ) => {
    const res = await request(app)
      .post('/api/problems')
      .set('Cookie', cookie)
      .send({
        title,
        topic,
        difficulty,
        platform: 'LeetCode',
        status: 'Not Started',
        estimatedTimeMinutes: 25,
      });
    return res.body.problem;
  };

  describe('POST /api/assessments and Full Contest Lifecycle', () => {
    it('creates, starts, submits attempts, and finishes mock interview contest with scorecard', async () => {
      const cookie = await getAuthCookie('contestant@example.com');

      // Create 2 problems: 1 Easy (20 pts), 1 Medium (40 pts) -> Max 60 pts
      const easyProb = await createProblem(cookie, 'Two Sum', 'Easy');
      const medProb = await createProblem(cookie, '3Sum', 'Medium');

      // 1. Create assessment
      const createRes = await request(app)
        .post('/api/assessments')
        .set('Cookie', cookie)
        .send({
          title: 'Speed Mock Contest #1',
          durationMinutes: 45,
          problemIds: [easyProb._id, medProb._id],
        });

      expect(createRes.status).toBe(201);
      const assessmentId = createRes.body.assessment._id;
      expect(createRes.body.assessment.title).toBe('Speed Mock Contest #1');
      expect(createRes.body.assessment.status).toBe('configured');
      expect(createRes.body.assessment.maxScore).toBe(60);
      expect(createRes.body.assessment.problems).toHaveLength(2);

      // 2. Start assessment
      const startRes = await request(app)
        .post(`/api/assessments/${assessmentId}/start`)
        .set('Cookie', cookie);

      expect(startRes.status).toBe(200);
      expect(startRes.body.assessment.status).toBe('in_progress');
      expect(startRes.body.assessment.startTime).toBeDefined();

      // 3. Submit attempt for Problem 1 (Solved in 15 mins)
      const sub1 = await request(app)
        .post(`/api/assessments/${assessmentId}/submit`)
        .set('Cookie', cookie)
        .send({
          problemId: easyProb._id,
          result: 'Solved',
          timeTakenMinutes: 15,
          notes: 'Hash map approach O(N)',
        });

      expect(sub1.status).toBe(200);
      expect(sub1.body.assessment.problems[0].status).toBe('solved');
      expect(sub1.body.assessment.problems[0].attempts).toBe(1);

      // 4. Submit attempt for Problem 2 (First Failed in 15 mins, then Solved in 10 mins)
      await request(app)
        .post(`/api/assessments/${assessmentId}/submit`)
        .set('Cookie', cookie)
        .send({
          problemId: medProb._id,
          result: 'Failed',
          timeTakenMinutes: 15,
          notes: 'Time limit exceeded on brute force',
        });

      const sub2 = await request(app)
        .post(`/api/assessments/${assessmentId}/submit`)
        .set('Cookie', cookie)
        .send({
          problemId: medProb._id,
          result: 'Solved',
          timeTakenMinutes: 10,
          notes: 'Two pointers sorting approach',
        });

      expect(sub2.status).toBe(200);
      expect(sub2.body.assessment.problems[1].status).toBe('solved');
      expect(sub2.body.assessment.problems[1].attempts).toBe(2);

      // 5. Finish assessment
      const finishRes = await request(app)
        .post(`/api/assessments/${assessmentId}/finish`)
        .set('Cookie', cookie);

      expect(finishRes.status).toBe(200);
      expect(finishRes.body.assessment.status).toBe('completed');
      expect(finishRes.body.assessment.endTime).toBeDefined();

      // Easy: 20 pts (1 attempt). Medium: 40 - 5 = 35 pts (2 attempts). Plus early finish time bonus
      expect(finishRes.body.assessment.score).toBeGreaterThanOrEqual(55);
      expect(finishRes.body.assessment.verdict).toBe('strong_hire');
    });

    it('validates input on creation (400 Bad Request)', async () => {
      const cookie = await getAuthCookie('valcontest@example.com');

      const noTitle = await request(app)
        .post('/api/assessments')
        .set('Cookie', cookie)
        .send({
          problemIds: ['507f1f77bcf86cd799439011'],
        });
      expect(noTitle.status).toBe(400);

      const noProblems = await request(app)
        .post('/api/assessments')
        .set('Cookie', cookie)
        .send({
          title: 'Empty Contest',
          problemIds: [],
        });
      expect(noProblems.status).toBe(400);
    });

    it('rejects unauthenticated requests (401 Unauthorized)', async () => {
      const res = await request(app).post('/api/assessments').send({
        title: 'Unauth Contest',
        problemIds: ['507f1f77bcf86cd799439011'],
      });
      expect(res.status).toBe(401);
    });
  });

  describe('Multi-tenant Security & Retrieval', () => {
    it('prevents User B from starting or viewing User A assessments', async () => {
      const userACookie = await getAuthCookie('user_a_contest@example.com');
      const userBCookie = await getAuthCookie('user_b_contest@example.com');

      const prob = await createProblem(userACookie, 'Binary Search', 'Easy');

      const createRes = await request(app)
        .post('/api/assessments')
        .set('Cookie', userACookie)
        .send({
          title: 'User A Private Assessment',
          problemIds: [prob._id],
        });

      const assessmentId = createRes.body.assessment._id;

      // User B tries to view User A's assessment
      const intruderGet = await request(app)
        .get(`/api/assessments/${assessmentId}`)
        .set('Cookie', userBCookie);
      expect(intruderGet.status).toBe(404);

      // User B tries to start User A's assessment
      const intruderStart = await request(app)
        .post(`/api/assessments/${assessmentId}/start`)
        .set('Cookie', userBCookie);
      expect(intruderStart.status).toBe(404);

      // Owner views successfully
      const ownerGet = await request(app)
        .get(`/api/assessments/${assessmentId}`)
        .set('Cookie', userACookie);
      expect(ownerGet.status).toBe(200);
      expect(ownerGet.body.assessment.title).toBe('User A Private Assessment');
      expect(ownerGet.body).toHaveProperty('remainingSeconds');
    });

    it('deletes assessment and confirms 404 on subsequent get', async () => {
      const cookie = await getAuthCookie('del_contest@example.com');
      const prob = await createProblem(cookie, 'Climbing Stairs', 'Easy');

      const createRes = await request(app)
        .post('/api/assessments')
        .set('Cookie', cookie)
        .send({
          title: 'To Be Deleted',
          problemIds: [prob._id],
        });

      const assessmentId = createRes.body.assessment._id;

      const delRes = await request(app)
        .delete(`/api/assessments/${assessmentId}`)
        .set('Cookie', cookie);
      expect(delRes.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/assessments/${assessmentId}`)
        .set('Cookie', cookie);
      expect(getRes.status).toBe(404);
    });
  });
});
