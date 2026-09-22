import {
  calculateTopicMastery,
  identifyWeakTopic,
  calculateStreaks,
} from '../../src/services/analyticsService';

describe('Deterministic Analytics & Mastery Unit Tests', () => {
  describe('calculateTopicMastery', () => {
    it('returns zero mastery score when no problems are solved and no attempts logged', () => {
      const result = calculateTopicMastery({
        solvedCount: 0,
        totalAttempts: 0,
        successfulAttempts: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
      });

      expect(result.masteryScore).toBe(0);
      expect(result.volumeScore).toBe(0);
      expect(result.successRate).toBe(0);
      expect(result.difficultyWeight).toBe(0);
    });

    it('calculates 100% mastery score when volume is maxed (>= 15), 100% success rate, and all Hard difficulty', () => {
      const result = calculateTopicMastery({
        solvedCount: 15,
        totalAttempts: 15,
        successfulAttempts: 15,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 15,
      });

      // S = 100 (100 * 0.40 = 40)
      // R = 100 (100 * 0.35 = 35)
      // D = (15*3)/(15*3)*100 = 100 (100 * 0.25 = 25)
      // Total = 40 + 35 + 25 = 100
      expect(result.masteryScore).toBe(100);
      expect(result.volumeScore).toBe(100);
      expect(result.successRate).toBe(100);
      expect(result.difficultyWeight).toBe(100);
    });

    it('accurately computes composite mastery score with mixed difficulty and success rates', () => {
      // 6 solved: 3 Easy, 2 Medium, 1 Hard
      // 10 total attempts, 8 successful (R = 80%)
      // Volume S = (6 / 15) * 100 = 40%
      // Difficulty D = ((3*1) + (2*2) + (1*3)) / (6*3) * 100 = (10/18)*100 = 55.55%
      // Raw: 40 * 0.4 + 80 * 0.35 + 55.555 * 0.25 = 16 + 28 + 13.888 = 57.888 -> round to 58
      const result = calculateTopicMastery({
        solvedCount: 6,
        totalAttempts: 10,
        successfulAttempts: 8,
        easySolved: 3,
        mediumSolved: 2,
        hardSolved: 1,
      });

      expect(result.masteryScore).toBe(58);
      expect(result.volumeScore).toBe(40);
      expect(result.successRate).toBe(80);
      expect(result.difficultyWeight).toBe(56); // 55.55 rounded
    });

    it('caps mastery score at 100 even if volume exceeds 15 solved', () => {
      const result = calculateTopicMastery({
        solvedCount: 25, // > 15
        totalAttempts: 25,
        successfulAttempts: 25,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 25,
      });

      expect(result.masteryScore).toBe(100);
      expect(result.volumeScore).toBe(100);
    });
  });

  describe('identifyWeakTopic', () => {
    it('does NOT flag a topic as weak if attemptCount < 3 regardless of scores', () => {
      const result = identifyWeakTopic(2, 20, 25);
      expect(result.isWeak).toBe(false);
      expect(result.reasons).toHaveLength(0);
    });

    it('flags topic as weak when attemptCount >= 3 and masteryScore < 50', () => {
      const result = identifyWeakTopic(4, 42, 60);
      expect(result.isWeak).toBe(true);
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Mastery score is 42% (below 50% threshold)'),
        ])
      );
    });

    it('flags topic as weak when attemptCount >= 3 and successRate < 50', () => {
      const result = identifyWeakTopic(5, 55, 40);
      expect(result.isWeak).toBe(true);
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Practice success rate is 40% (below 50% threshold)'),
        ])
      );
    });

    it('flags both reasons when both masteryScore and successRate are below 50', () => {
      const result = identifyWeakTopic(6, 30, 33);
      expect(result.isWeak).toBe(true);
      expect(result.reasons).toHaveLength(2);
    });

    it('does NOT flag topic as weak when attemptCount >= 3 and both scores >= 50', () => {
      const result = identifyWeakTopic(5, 65, 75);
      expect(result.isWeak).toBe(false);
      expect(result.reasons).toHaveLength(0);
    });
  });

  describe('calculateStreaks', () => {
    it('returns 0 streak for empty dates array', () => {
      const result = calculateStreaks([]);
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.activeToday).toBe(false);
      expect(result.history).toEqual({});
    });

    it('computes streak of 1 when practiced today', () => {
      const today = new Date();
      const result = calculateStreaks([today]);

      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.activeToday).toBe(true);
    });

    it('preserves streak when practiced yesterday but not yet today', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const result = calculateStreaks([twoDaysAgo, yesterday]);

      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(2);
      expect(result.activeToday).toBe(false);
    });

    it('detects broken streak when no practice yesterday or today', () => {
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      const result = calculateStreaks([fourDaysAgo, threeDaysAgo]);

      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(2);
      expect(result.activeToday).toBe(false);
    });

    it('computes consecutive multi-day streak up to today', () => {
      const now = Date.now();
      const dates = [
        new Date(now - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        new Date(now - 1 * 24 * 60 * 60 * 1000), // yesterday
        new Date(now),                           // today
      ];

      const result = calculateStreaks(dates);
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
      expect(result.activeToday).toBe(true);
    });
  });
});
