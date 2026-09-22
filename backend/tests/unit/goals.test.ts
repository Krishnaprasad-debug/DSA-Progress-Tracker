import {
  getWeekBounds,
  calculateProgress,
  goalService,
} from '../../src/services/goalService';
import { calculateVelocityTrend } from '../../src/services/reportService';
import { IGoal } from '../../src/models/Goal';
import { Types } from 'mongoose';

describe('Deterministic Goals & Weekly Reporting Unit Tests', () => {
  describe('getWeekBounds', () => {
    it('accurately identifies Monday 00:00 UTC and Sunday 23:59:59.999 UTC for a Wednesday', () => {
      // 2026-09-23 is Wednesday
      const wednesday = new Date('2026-09-23T14:30:00.000Z');
      const { startOfWeek, endOfWeek } = getWeekBounds(wednesday);

      expect(startOfWeek.toISOString()).toBe('2026-09-21T00:00:00.000Z'); // Monday
      expect(endOfWeek.toISOString()).toBe('2026-09-27T23:59:59.999Z'); // Sunday
    });

    it('correctly anchors when referenceDate is Monday itself', () => {
      const monday = new Date('2026-09-21T08:00:00.000Z');
      const { startOfWeek, endOfWeek } = getWeekBounds(monday);

      expect(startOfWeek.toISOString()).toBe('2026-09-21T00:00:00.000Z');
      expect(endOfWeek.toISOString()).toBe('2026-09-27T23:59:59.999Z');
    });

    it('correctly anchors when referenceDate is Sunday (end of week)', () => {
      const sunday = new Date('2026-09-27T22:00:00.000Z');
      const { startOfWeek, endOfWeek } = getWeekBounds(sunday);

      expect(startOfWeek.toISOString()).toBe('2026-09-21T00:00:00.000Z');
      expect(endOfWeek.toISOString()).toBe('2026-09-27T23:59:59.999Z');
    });
  });

  describe('calculateProgress', () => {
    it('returns 0 progress and not completed if target is 0 or negative', () => {
      expect(calculateProgress(5, 0)).toEqual({
        progressPercentage: 0,
        isCompleted: false,
      });
      expect(calculateProgress(5, -1)).toEqual({
        progressPercentage: 0,
        isCompleted: false,
      });
    });

    it('computes exact percentage for partial progress', () => {
      const res = calculateProgress(3, 10);
      expect(res.progressPercentage).toBe(30);
      expect(res.isCompleted).toBe(false);
    });

    it('caps progress at 100% and flags isCompleted when target reached or exceeded', () => {
      const exact = calculateProgress(10, 10);
      expect(exact.progressPercentage).toBe(100);
      expect(exact.isCompleted).toBe(true);

      const exceeded = calculateProgress(15, 10);
      expect(exceeded.progressPercentage).toBe(100);
      expect(exceeded.isCompleted).toBe(true);
    });
  });

  describe('calculateVelocityTrend', () => {
    it('returns accelerating when problems solved increase', () => {
      expect(calculateVelocityTrend(2, 30)).toBe('accelerating');
      expect(calculateVelocityTrend(1, -10)).toBe('accelerating');
    });

    it('returns accelerating when solved is flat but practice time increased', () => {
      expect(calculateVelocityTrend(0, 45)).toBe('accelerating');
    });

    it('returns declining when both solved and time dropped', () => {
      expect(calculateVelocityTrend(-3, -60)).toBe('declining');
    });

    it('returns steady when metrics are mixed or flat', () => {
      expect(calculateVelocityTrend(0, 0)).toBe('steady');
      expect(calculateVelocityTrend(-1, 20)).toBe('steady');
    });
  });

  describe('goalService.evaluateGoal', () => {
    const mockContext = {
      weeklyProblemsSolved: 8,
      weeklyMinutes: 240,
      topicMasteryMap: new Map([
        ['Dynamic Programming', 65],
        ['Trees', 85],
      ]),
      totalSolved: 25,
    };

    it('evaluates weekly_problems goal and auto-completes when target is reached', () => {
      const mockGoal = {
        _id: new Types.ObjectId(),
        type: 'weekly_problems',
        targetValue: 8,
        status: 'active',
      } as unknown as IGoal;

      const evaluated = goalService.evaluateGoal(mockGoal, mockContext);
      expect(evaluated.currentValue).toBe(8);
      expect(evaluated.progressPercentage).toBe(100);
      expect(evaluated.status).toBe('completed');
    });

    it('evaluates practice_time goal with partial progress', () => {
      const mockGoal = {
        _id: new Types.ObjectId(),
        type: 'practice_time',
        targetValue: 300,
        status: 'active',
      } as unknown as IGoal;

      const evaluated = goalService.evaluateGoal(mockGoal, mockContext);
      expect(evaluated.currentValue).toBe(240);
      // 240 / 300 = 80%
      expect(evaluated.progressPercentage).toBe(80);
      expect(evaluated.status).toBe('active');
    });

    it('evaluates topic_mastery goal using topic mastery map', () => {
      const mockGoal = {
        _id: new Types.ObjectId(),
        type: 'topic_mastery',
        topic: 'Dynamic Programming',
        targetValue: 70,
        status: 'active',
      } as unknown as IGoal;

      const evaluated = goalService.evaluateGoal(mockGoal, mockContext);
      expect(evaluated.currentValue).toBe(65);
      // 65 / 70 = 93%
      expect(evaluated.progressPercentage).toBe(93);
      expect(evaluated.status).toBe('active');
    });
  });
});
