import request from 'supertest';
import app from '../../src/app';
import { connectTestDB, clearTestDB, closeTestDB } from '../utils/dbHandler';

describe('Problem Management Integration Test Suite', () => {
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

  const sampleProblem = {
    title: 'Two Sum',
    description: 'Find two numbers that add up to target',
    topic: 'Arrays',
    difficulty: 'Easy',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/two-sum/',
    status: 'Solved',
    notes: 'Used hash map for O(n) solution',
    tags: ['Hash Table', 'Two Pointers'],
    estimatedTimeMinutes: 20,
  };

  describe('POST /api/problems', () => {
    it('creates a new problem when authenticated and returns 201 Created', async () => {
      const cookie = await getAuthCookie('user1@example.com');

      const response = await request(app)
        .post('/api/problems')
        .set('Cookie', cookie)
        .send(sampleProblem);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('problem');
      expect(response.body.problem).toMatchObject({
        title: 'Two Sum',
        topic: 'Arrays',
        difficulty: 'Easy',
        platform: 'LeetCode',
        status: 'Solved',
        estimatedTimeMinutes: 20,
      });
      expect(response.body.problem).toHaveProperty('_id');
      expect(response.body.problem).toHaveProperty('user');
    });

    it('rejects creation when unauthenticated (401 Unauthorized)', async () => {
      const response = await request(app)
        .post('/api/problems')
        .send(sampleProblem);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('validates required fields and enums (400 Bad Request)', async () => {
      const cookie = await getAuthCookie('user1@example.com');

      const response = await request(app)
        .post('/api/problems')
        .set('Cookie', cookie)
        .send({
          title: '',
          topic: 'InvalidTopic',
          difficulty: 'SuperHard',
          platform: 'UnknownSite',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Failed');
      expect(response.body.details.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('GET /api/problems', () => {
    it('returns problems scoped strictly to the authenticated user', async () => {
      const user1Cookie = await getAuthCookie('user1@example.com');
      const user2Cookie = await getAuthCookie('user2@example.com');

      // User 1 creates Two Sum
      await request(app).post('/api/problems').set('Cookie', user1Cookie).send(sampleProblem);

      // User 2 creates 3Sum
      await request(app).post('/api/problems').set('Cookie', user2Cookie).send({
        ...sampleProblem,
        title: '3Sum',
        difficulty: 'Medium',
      });

      // User 1 fetches problems
      const res1 = await request(app).get('/api/problems').set('Cookie', user1Cookie);
      expect(res1.status).toBe(200);
      expect(res1.body.count).toBe(1);
      expect(res1.body.problems[0].title).toBe('Two Sum');

      // User 2 fetches problems
      const res2 = await request(app).get('/api/problems').set('Cookie', user2Cookie);
      expect(res2.status).toBe(200);
      expect(res2.body.count).toBe(1);
      expect(res2.body.problems[0].title).toBe('3Sum');
    });

    it('filters problems by topic, difficulty, status, and search keyword', async () => {
      const cookie = await getAuthCookie('user1@example.com');

      await request(app).post('/api/problems').set('Cookie', cookie).send(sampleProblem);
      await request(app).post('/api/problems').set('Cookie', cookie).send({
        ...sampleProblem,
        title: 'Binary Tree Inorder Traversal',
        topic: 'Trees',
        difficulty: 'Easy',
        status: 'Not Started',
      });
      await request(app).post('/api/problems').set('Cookie', cookie).send({
        ...sampleProblem,
        title: 'Longest Palindromic Substring',
        topic: 'Dynamic Programming',
        difficulty: 'Medium',
        status: 'Attempted',
      });

      // Topic filter
      const topicRes = await request(app).get('/api/problems?topic=Trees').set('Cookie', cookie);
      expect(topicRes.status).toBe(200);
      expect(topicRes.body.count).toBe(1);
      expect(topicRes.body.problems[0].title).toBe('Binary Tree Inorder Traversal');

      // Difficulty filter
      const diffRes = await request(app).get('/api/problems?difficulty=Medium').set('Cookie', cookie);
      expect(diffRes.status).toBe(200);
      expect(diffRes.body.count).toBe(1);
      expect(diffRes.body.problems[0].title).toBe('Longest Palindromic Substring');

      // Search keyword filter
      const searchRes = await request(app).get('/api/problems?search=Palindromic').set('Cookie', cookie);
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.count).toBe(1);
      expect(searchRes.body.problems[0].title).toBe('Longest Palindromic Substring');
    });
  });

  describe('GET /api/problems/:id', () => {
    it('retrieves single problem by ID', async () => {
      const cookie = await getAuthCookie('user1@example.com');
      const createRes = await request(app).post('/api/problems').set('Cookie', cookie).send(sampleProblem);
      const problemId = createRes.body.problem._id;

      const res = await request(app).get(`/api/problems/${problemId}`).set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(res.body.problem.title).toBe('Two Sum');
    });

    it('returns 404 when User B tries to view User A problem', async () => {
      const user1Cookie = await getAuthCookie('user1@example.com');
      const user2Cookie = await getAuthCookie('user2@example.com');

      const createRes = await request(app).post('/api/problems').set('Cookie', user1Cookie).send(sampleProblem);
      const problemId = createRes.body.problem._id;

      const res = await request(app).get(`/api/problems/${problemId}`).set('Cookie', user2Cookie);
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Problem not found');
    });

    it('returns 400 for invalid ObjectId format', async () => {
      const cookie = await getAuthCookie('user1@example.com');
      const res = await request(app).get('/api/problems/not-a-valid-id').set('Cookie', cookie);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid problem ID format');
    });
  });

  describe('PUT /api/problems/:id', () => {
    it('updates problem details successfully', async () => {
      const cookie = await getAuthCookie('user1@example.com');
      const createRes = await request(app).post('/api/problems').set('Cookie', cookie).send(sampleProblem);
      const problemId = createRes.body.problem._id;

      const updateRes = await request(app)
        .put(`/api/problems/${problemId}`)
        .set('Cookie', cookie)
        .send({
          status: 'Mastered',
          notes: 'Mastered both hash map and two pointer variations',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.problem.status).toBe('Mastered');
      expect(updateRes.body.problem.notes).toContain('Mastered both');
    });

    it('prevents unauthorized user from updating someone else problem (404 Not Found)', async () => {
      const user1Cookie = await getAuthCookie('user1@example.com');
      const user2Cookie = await getAuthCookie('user2@example.com');

      const createRes = await request(app).post('/api/problems').set('Cookie', user1Cookie).send(sampleProblem);
      const problemId = createRes.body.problem._id;

      const updateRes = await request(app)
        .put(`/api/problems/${problemId}`)
        .set('Cookie', user2Cookie)
        .send({ status: 'Mastered' });

      expect(updateRes.status).toBe(404);
      expect(updateRes.body).toHaveProperty('error', 'Problem not found');
    });
  });

  describe('DELETE /api/problems/:id', () => {
    it('deletes problem successfully and confirms 404 on subsequent get', async () => {
      const cookie = await getAuthCookie('user1@example.com');
      const createRes = await request(app).post('/api/problems').set('Cookie', cookie).send(sampleProblem);
      const problemId = createRes.body.problem._id;

      const deleteRes = await request(app).delete(`/api/problems/${problemId}`).set('Cookie', cookie);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body).toHaveProperty('message', 'Problem deleted successfully');

      const verifyRes = await request(app).get(`/api/problems/${problemId}`).set('Cookie', cookie);
      expect(verifyRes.status).toBe(404);
    });

    it('prevents unauthorized user from deleting someone else problem (404 Not Found)', async () => {
      const user1Cookie = await getAuthCookie('user1@example.com');
      const user2Cookie = await getAuthCookie('user2@example.com');

      const createRes = await request(app).post('/api/problems').set('Cookie', user1Cookie).send(sampleProblem);
      const problemId = createRes.body.problem._id;

      const deleteRes = await request(app).delete(`/api/problems/${problemId}`).set('Cookie', user2Cookie);
      expect(deleteRes.status).toBe(404);
      expect(deleteRes.body).toHaveProperty('error', 'Problem not found');
    });
  });
});
