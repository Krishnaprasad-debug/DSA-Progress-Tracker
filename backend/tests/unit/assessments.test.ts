import {
  getPointWeight,
  calculateScoring,
} from '../../src/services/assessmentService';
import { IAssessmentProblem } from '../../src/models/Assessment';
import { Types } from 'mongoose';

describe('Deterministic Assessment Scoring Unit Tests', () => {
  describe('getPointWeight', () => {
    it('returns exact point weights for canonical difficulties', () => {
      expect(getPointWeight('Easy')).toBe(20);
      expect(getPointWeight('Medium')).toBe(40);
      expect(getPointWeight('Hard')).toBe(60);
      expect(getPointWeight('Unknown')).toBe(40);
    });
  });

  describe('calculateScoring', () => {
    it('awards full points and maximum time bonus when all problems are solved early', () => {
      const mockProblems: IAssessmentProblem[] = [
        {
          problem: new Types.ObjectId(),
          pointWeight: 20,
          status: 'solved',
          attempts: 1,
          timeTakenMinutes: 10,
        },
        {
          problem: new Types.ObjectId(),
          pointWeight: 40,
          status: 'solved',
          attempts: 1,
          timeTakenMinutes: 15,
        },
        {
          problem: new Types.ObjectId(),
          pointWeight: 60,
          status: 'solved',
          attempts: 1,
          timeTakenMinutes: 20,
        },
      ];

      // 60 minutes total, finished in 45 minutes (15 mins remaining)
      const res = calculateScoring(mockProblems, 60, 45);

      expect(res.maxScore).toBe(120);
      // Base: 20 + 40 + 60 = 120. Time bonus: (15/60)*15 = 3.75 -> 4 pts. Capped at 120.
      expect(res.score).toBe(120);
      expect(res.percentage).toBe(100);
      expect(res.verdict).toBe('strong_hire');
    });

    it('deducts 5 points per failed attempt and respects the 50% floor', () => {
      const mockProblems: IAssessmentProblem[] = [
        {
          // Medium problem (40 pts) solved on 3rd attempt (2 failed attempts = -10 pts) -> 30 pts
          problem: new Types.ObjectId(),
          pointWeight: 40,
          status: 'solved',
          attempts: 3,
          timeTakenMinutes: 25,
        },
        {
          // Easy problem (20 pts) solved on 6th attempt (5 failed = -25 pts) -> Floor is 10 pts (50%)
          problem: new Types.ObjectId(),
          pointWeight: 20,
          status: 'solved',
          attempts: 6,
          timeTakenMinutes: 20,
        },
      ];

      const res = calculateScoring(mockProblems, 60, 45);

      // Max: 60 pts
      expect(res.maxScore).toBe(60);
      // Earned: 30 + 10 = 40 pts base. Plus time bonus (15/60)*15 = 4 -> 44 pts
      expect(res.score).toBe(44);
      // 44 / 60 = 73%
      expect(res.percentage).toBe(73);
      expect(res.verdict).toBe('hire');
    });

    it('awards 0 points for unsolved problems and denies time bonus', () => {
      const mockProblems: IAssessmentProblem[] = [
        {
          problem: new Types.ObjectId(),
          pointWeight: 40,
          status: 'solved',
          attempts: 1,
          timeTakenMinutes: 20,
        },
        {
          problem: new Types.ObjectId(),
          pointWeight: 60,
          status: 'failed',
          attempts: 2,
          timeTakenMinutes: 30,
        },
      ];

      const res = calculateScoring(mockProblems, 60, 50);

      expect(res.maxScore).toBe(100);
      // Only 40 pts earned, no time bonus
      expect(res.score).toBe(40);
      expect(res.percentage).toBe(40);
      expect(res.timeBonus).toBe(0);
      expect(res.verdict).toBe('needs_practice');
    });

    it('correctly maps percentage to leaning_hire verdict (50% - 69%)', () => {
      const mockProblems: IAssessmentProblem[] = [
        {
          problem: new Types.ObjectId(),
          pointWeight: 60,
          status: 'solved',
          attempts: 2, // -5 pts penalty -> 55 pts
          timeTakenMinutes: 40,
        },
        {
          problem: new Types.ObjectId(),
          pointWeight: 40,
          status: 'unsolved',
          attempts: 1,
          timeTakenMinutes: 10,
        },
      ];

      const res = calculateScoring(mockProblems, 60, 50);
      expect(res.score).toBe(55);
      expect(res.percentage).toBe(55);
      expect(res.verdict).toBe('leaning_hire');
    });
  });
});
