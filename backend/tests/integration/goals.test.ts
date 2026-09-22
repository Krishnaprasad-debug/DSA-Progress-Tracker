import request from 'supertest';
import app from '../../src/app';
import { connectTestDB, clearTestDB, closeTestDB } from '../utils/dbHandler';

describe('Personal Goals & Weekly Reports Integration Test Suite', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  const getAuthCookie = async (email: string, name = 'Goal User'): Promise<string[]> => {
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
    topic: string,
    difficulty = 'Medium',
    status = 'Not Started'
  ) => {
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

  const logAttempt = async (
    cookie: string[],
    problemId: string,
    result: 'Solved' | 'Failed',
    timeTaken = 20
  ) => {
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

  describe('POST /api/goals', () => {
    it('creates a weekly_problems goal and calculates initial progress', async () => {
      const cookie = await getAuthCookie('goaluser1@example.com');

      const res = await request(app)
        .post('/api/goals')
        .set('Cookie', cookie)
        .send({
          title: 'Solve 10 Problems This Week',
          type: 'weekly_problems',
          targetValue: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.goal).toHaveProperty('_id');
      expect(res.body.goal.title).toBe('Solve 10 Problems This Week');
      expect(res.body.goal.type).toBe('weekly_problems');
      expect(res.body.goal.targetValue).toBe(10);
      expect(res.body.goal.currentValue).toBe(0);
      expect(res.body.goal.progressPercentage).toBe(0);
      expect(res.body.goal.status).toBe('active');
    });

    it('creates a topic_mastery goal requiring a canonical topic', async () => {
      const cookie = await getAuthCookie('topicgoal@example.com');

      const res = await request(app)
        .post('/api/goals')
        .set('Cookie', cookie)
        .send({
          title: 'Master Dynamic Programming',
          type: 'topic_mastery',
          topic: 'Dynamic Programming',
          targetValue: 75,
        });

      expect(res.status).toBe(201);
      expect(res.body.goal.topic).toBe('Dynamic Programming');
    });

    it('validates required fields and enums (400 Bad Request)', async () => {
      const cookie = await getAuthCookie('valgoal@example.com');

      const missingTitle = await request(app)
        .post('/api/goals')
        .set('Cookie', cookie)
        .send({
          type: 'weekly_problems',
          targetValue: 5,
        });
      expect(missingTitle.status).toBe(400);

      const invalidType = await request(app)
        .post('/api/goals')
        .set('Cookie', cookie)
        .send({
          title: 'Invalid Goal',
          type: 'non_existent_type',
          targetValue: 5,
        });
      expect(invalidType.status).toBe(400);

      const missingTopic = await request(app)
        .post('/api/goals')
        .set('Cookie', cookie)
        .send({
          title: 'Master Something',
          type: 'topic_mastery',
          targetValue: 80,
        });
      expect(missingTopic.status).toBe(400);
    });

    it('rejects unauthenticated requests (401 Unauthorized)', async () => {
      const res = await request(app).post('/api/goals').send({
        title: 'Unauth Goal',
        type: 'weekly_problems',
        targetValue: 5,
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/goals', () => {
    it('returns goals scoped strictly to authenticated user', async () => {
      const userACookie = await getAuthCookie('usera_goals@example.com');
      const userBCookie = await getAuthCookie('userb_goals@example.com');

      await request(app)
        .post('/api/goals')
        .set('Cookie', userACookie)
        .send({
          title: 'User A Goal',
          type: 'weekly_problems',
          targetValue: 5,
        });

      await request(app)
        .post('/api/goals')
        .set('Cookie', userBCookie)
        .send({
          title: 'User B Goal',
          type: 'practice_time',
          targetValue: 120,
        });

      const resA = await request(app).get('/api/goals').set('Cookie', userACookie);
      expect(resA.status).toBe(200);
      expect(resA.body.count).toBe(1);
      expect(resA.body.goals[0].title).toBe('User A Goal');

      const resB = await request(app).get('/api/goals').set('Cookie', userBCookie);
      expect(resB.status).toBe(200);
      expect(resB.body.count).toBe(1);
      expect(resB.body.goals[0].title).toBe('User B Goal');
    });

    it('filters goals by status query parameter', async () => {
      const cookie = await getAuthCookie('statusfilter@example.com');

      const goalRes = await request(app)
        .post('/api/goals')
        .set('Cookie', cookie)
        .send({
          title: 'Active Goal',
          type: 'weekly_problems',
          targetValue: 10,
        });

      // Mark one goal cancelled
      await request(app)
        .put(`/api/goals/${goalRes.body.goal._id}`)
        .set('Cookie', cookie)
        .send({ status: 'cancelled' });

      // Add another active goal
      await request(app)
        .post('/api/goals')
        .set('Cookie', cookie)
        .send({
          title: 'Second Active Goal',
          type: 'practice_time',
          targetValue: 60,
        });

      const activeRes = await request(app)
        .get('/api/goals?status=active')
        .set('Cookie', cookie);
      expect(activeRes.status).toBe(200);
      expect(activeRes.body.count).toBe(1);
      expect(activeRes.body.goals[0].title).toBe('Second Active Goal');
    });
  });

  describe('GET /api/goals/:id and PUT /api/goals/:id and DELETE /api/goals/:id', () => {
    it('retrieves single goal by ID and prevents other users from viewing it', async () => {
      const userACookie = await getAuthCookie('owner@example.com');
      const userBCookie = await getAuthCookie('intruder@example.com');

      const createRes = await request(app)
        .post('/api/goals')
        .set('Cookie', userACookie)
        .send({
          title: 'Owner Goal',
          type: 'weekly_problems',
          targetValue: 10,
        });

      const goalId = createRes.body.goal._id;

      const getRes = await request(app)
        .get(`/api/goals/${goalId}`)
        .set('Cookie', userACookie);
      expect(getRes.status).toBe(200);
      expect(getRes.body.title).toBe('Owner Goal');

      // User B receives 404
      const failRes = await request(app)
        .get(`/api/goals/${goalId}`)
        .set('Cookie', userBCookie);
      expect(failRes.status).toBe(404);
    });

    it('updates goal details and prevents unauthorized updates', async () => {
      const userACookie = await getAuthCookie('update_owner@example.com');
      const userBCookie = await getAuthCookie('update_intruder@example.com');

      const createRes = await request(app)
        .post('/api/goals')
        .set('Cookie', userACookie)
        .send({
          title: 'Original Title',
          type: 'weekly_problems',
          targetValue: 5,
        });

      const goalId = createRes.body.goal._id;

      // Intruder update fails with 404
      const intruderRes = await request(app)
        .put(`/api/goals/${goalId}`)
        .set('Cookie', userBCookie)
        .send({ title: 'Hacked Title' });
      expect(intruderRes.status).toBe(404);

      // Owner update succeeds
      const updateRes = await request(app)
        .put(`/api/goals/${goalId}`)
        .set('Cookie', userACookie)
        .send({
          title: 'Updated Goal Title',
          targetValue: 12,
        });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.goal.title).toBe('Updated Goal Title');
      expect(updateRes.body.goal.targetValue).toBe(12);
    });

    it('deletes goal and prevents unauthorized deletion', async () => {
      const userACookie = await getAuthCookie('del_owner@example.com');
      const userBCookie = await getAuthCookie('del_intruder@example.com');

      const createRes = await request(app)
        .post('/api/goals')
        .set('Cookie', userACookie)
        .send({
          title: 'Goal to delete',
          type: 'weekly_problems',
          targetValue: 5,
        });

      const goalId = createRes.body.goal._id;

      // Intruder delete fails with 404
      const intruderDel = await request(app)
        .delete(`/api/goals/${goalId}`)
        .set('Cookie', userBCookie);
      expect(intruderDel.status).toBe(404);

      // Owner delete succeeds
      const ownerDel = await request(app)
        .delete(`/api/goals/${goalId}`)
        .set('Cookie', userACookie);
      expect(ownerDel.status).toBe(200);

      // Subsequent get confirms 404
      const getAgain = await request(app)
        .get(`/api/goals/${goalId}`)
        .set('Cookie', userACookie);
      expect(getAgain.status).toBe(404);
    });
  });

  describe('GET /api/reports/weekly', () => {
    it('generates weekly report with metrics, daily breakdown, and neglected weak topics', async () => {
      const cookie = await getAuthCookie('reportuser@example.com');

      // Create problems: 1 Easy DP (Failed 3 times to make DP a weak topic)
      const dpProb = await createProblem(cookie, 'Dynamic Programming', 'Easy');
      await logAttempt(cookie, dpProb._id, 'Failed', 30);
      await logAttempt(cookie, dpProb._id, 'Failed', 25);
      await logAttempt(cookie, dpProb._id, 'Failed', 20);

      // 1 Solved Array problem
      const arrayProb = await createProblem(cookie, 'Arrays', 'Easy');
      await logAttempt(cookie, arrayProb._id, 'Solved', 15);

      // Set a goal
      await request(app)
        .post('/api/goals')
        .set('Cookie', cookie)
        .send({
          title: 'Weekly Problems Target',
          type: 'weekly_problems',
          targetValue: 5,
        });

      const res = await request(app).get('/api/reports/weekly').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('weekRange');
      expect(res.body).toHaveProperty('summary');
      expect(res.body.summary.totalAttempts).toBe(4);
      expect(res.body.summary.solvedAttempts).toBe(1);
      expect(res.body.summary.practiceTimeMinutes).toBe(90); // 30+25+20+15

      // Daily breakdown must have 7 days
      expect(res.body.dailyBreakdown).toHaveLength(7);

      // Previous week comparison
      expect(res.body.previousWeekComparison).toHaveProperty('velocityTrend');

      // Active goals
      expect(res.body.activeGoals.length).toBeGreaterThanOrEqual(1);
    });
  });
});
