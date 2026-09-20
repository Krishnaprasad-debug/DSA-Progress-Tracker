import {
  evaluateStruggleDetection,
  AttemptSummary,
  StruggleDetectionInput,
} from '../../src/services/struggleService';

describe('Deterministic Struggle Detection Unit Tests', () => {
  const baseProblem: StruggleDetectionInput = {
    status: 'Attempted',
    difficulty: 'Medium',
  };

  it('returns isStruggle: false for empty attempts array', () => {
    const result = evaluateStruggleDetection(baseProblem, [], 30);
    expect(result.isStruggle).toBe(false);
    expect(result.reasons).toHaveLength(0);
  });

  describe('Condition 1: Failed attempts >= 3', () => {
    it('flags struggle when there are 3 failed attempts', () => {
      const attempts: AttemptSummary[] = [
        { result: 'Failed', timeTakenMinutes: 20, attemptNumber: 1 },
        { result: 'Failed', timeTakenMinutes: 25, attemptNumber: 2 },
        { result: 'Failed', timeTakenMinutes: 30, attemptNumber: 3 },
      ];

      const result = evaluateStruggleDetection(baseProblem, attempts, 30);
      expect(result.isStruggle).toBe(true);
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining('3 failed attempts (threshold: 3)'),
        ])
      );
    });

    it('flags struggle when there are more than 3 failed attempts mixed with solved attempts', () => {
      const attempts: AttemptSummary[] = [
        { result: 'Failed', timeTakenMinutes: 20, attemptNumber: 1 },
        { result: 'Failed', timeTakenMinutes: 25, attemptNumber: 2 },
        { result: 'Solved', timeTakenMinutes: 30, attemptNumber: 3 },
        { result: 'Failed', timeTakenMinutes: 25, attemptNumber: 4 },
        { result: 'Failed', timeTakenMinutes: 20, attemptNumber: 5 },
      ];

      const result = evaluateStruggleDetection(baseProblem, attempts, 30);
      expect(result.isStruggle).toBe(true);
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining('4 failed attempts'),
        ])
      );
    });

    it('does not trigger condition 1 when failed attempts < 3', () => {
      const attempts: AttemptSummary[] = [
        { result: 'Failed', timeTakenMinutes: 20, attemptNumber: 1 },
        { result: 'Failed', timeTakenMinutes: 25, attemptNumber: 2 },
      ];

      const result = evaluateStruggleDetection(baseProblem, attempts, 30);
      expect(result.isStruggle).toBe(false);
      expect(result.reasons).toHaveLength(0);
    });
  });

  describe('Condition 2: Latest attempt > 1.5x user difficulty average solving time', () => {
    it('flags struggle when latest attempt time exceeds 1.5x average', () => {
      // User average for Medium is 20 minutes. Threshold is 30 minutes.
      const attempts: AttemptSummary[] = [
        { result: 'Failed', timeTakenMinutes: 15, attemptNumber: 1 },
        { result: 'Solved', timeTakenMinutes: 35, attemptNumber: 2 }, // 35 > 1.5 * 20
      ];

      const result = evaluateStruggleDetection(baseProblem, attempts, 20);
      expect(result.isStruggle).toBe(true);
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Latest attempt took 35 mins, exceeding 1.5x user average'),
        ])
      );
    });

    it('does not flag struggle when latest attempt is within 1.5x average', () => {
      // User average is 20 minutes. Threshold is 30 minutes.
      const attempts: AttemptSummary[] = [
        { result: 'Solved', timeTakenMinutes: 28, attemptNumber: 1 }, // 28 <= 30
      ];

      const result = evaluateStruggleDetection(baseProblem, attempts, 20);
      expect(result.isStruggle).toBe(false);
      expect(result.reasons).toHaveLength(0);
    });

    it('gracefully ignores condition 2 when user average is null or 0', () => {
      const attempts: AttemptSummary[] = [
        { result: 'Solved', timeTakenMinutes: 120, attemptNumber: 1 },
      ];

      const resultNull = evaluateStruggleDetection(baseProblem, attempts, null);
      expect(resultNull.isStruggle).toBe(false);

      const resultZero = evaluateStruggleDetection(baseProblem, attempts, 0);
      expect(resultZero.isStruggle).toBe(false);
    });
  });

  describe('Condition 3: Total attempts >= 4 and status is NOT Mastered', () => {
    it('flags struggle when total attempts >= 4 and status is Attempted or Solved', () => {
      const attempts: AttemptSummary[] = [
        { result: 'Solved', timeTakenMinutes: 10, attemptNumber: 1 },
        { result: 'Solved', timeTakenMinutes: 10, attemptNumber: 2 },
        { result: 'Solved', timeTakenMinutes: 10, attemptNumber: 3 },
        { result: 'Solved', timeTakenMinutes: 10, attemptNumber: 4 },
      ];

      const result = evaluateStruggleDetection(
        { status: 'Solved', difficulty: 'Easy' },
        attempts,
        15
      );
      expect(result.isStruggle).toBe(true);
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining('has 4 attempts and has not reached Mastered status'),
        ])
      );
    });

    it('does NOT flag struggle when total attempts >= 4 but status IS Mastered', () => {
      const attempts: AttemptSummary[] = [
        { result: 'Solved', timeTakenMinutes: 10, attemptNumber: 1 },
        { result: 'Solved', timeTakenMinutes: 10, attemptNumber: 2 },
        { result: 'Solved', timeTakenMinutes: 10, attemptNumber: 3 },
        { result: 'Solved', timeTakenMinutes: 10, attemptNumber: 4 },
      ];

      const result = evaluateStruggleDetection(
        { status: 'Mastered', difficulty: 'Easy' },
        attempts,
        15
      );
      expect(result.isStruggle).toBe(false);
      expect(result.reasons).toHaveLength(0);
    });
  });

  describe('Multi-condition Evaluation', () => {
    it('returns all triggered reasons when multiple conditions are met', () => {
      // 4 attempts, 3 failed, latest took 50 mins (avg is 20, threshold is 30), status is Attempted
      const attempts: AttemptSummary[] = [
        { result: 'Failed', timeTakenMinutes: 20, attemptNumber: 1 },
        { result: 'Failed', timeTakenMinutes: 20, attemptNumber: 2 },
        { result: 'Failed', timeTakenMinutes: 20, attemptNumber: 3 },
        { result: 'Solved', timeTakenMinutes: 50, attemptNumber: 4 },
      ];

      const result = evaluateStruggleDetection(baseProblem, attempts, 20);
      expect(result.isStruggle).toBe(true);
      expect(result.reasons).toHaveLength(3);
    });
  });
});
