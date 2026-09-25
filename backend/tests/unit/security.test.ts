import { sanitizeData } from '../../src/middleware/sanitize';
import { createLimiter } from '../../src/middleware/rateLimiter';

describe('Security Hardening Unit Tests', () => {
  describe('sanitizeData', () => {
    it('returns primitives, null, and undefined unchanged', () => {
      expect(sanitizeData(null)).toBeNull();
      expect(sanitizeData(undefined)).toBeUndefined();
      expect(sanitizeData('hello world')).toBe('hello world');
      expect(sanitizeData(42)).toBe(42);
      expect(sanitizeData(true)).toBe(true);
    });

    it('strips keys starting with $ (NoSQL operator injection)', () => {
      const malicious = {
        username: 'admin',
        password: {
          $gt: '',
          $ne: 'secret',
        },
        $where: 'sleep(1000)',
      };

      const sanitized = sanitizeData(malicious) as Record<string, unknown>;

      expect(sanitized).toEqual({
        username: 'admin',
        password: {},
      });
      expect(sanitized['$where']).toBeUndefined();
    });

    it('strips keys containing dot notation (property path injection)', () => {
      const payload = {
        'user.role': 'admin',
        'profile.permissions.canDelete': true,
        normalKey: 'safeValue',
      };

      const sanitized = sanitizeData(payload) as Record<string, unknown>;

      expect(sanitized).toEqual({
        normalKey: 'safeValue',
      });
      expect(sanitized['user.role']).toBeUndefined();
    });

    it('recursively sanitizes nested objects and arrays', () => {
      const complexData = {
        items: [
          { name: 'item1', $badKey: 'removeMe' },
          { name: 'item2', 'bad.dot': 123 },
          'plainString',
        ],
        nested: {
          level2: {
            $invalid: true,
            validProp: 'preserved',
          },
        },
      };

      const sanitized = sanitizeData(complexData) as Record<string, unknown>;

      expect(sanitized).toEqual({
        items: [
          { name: 'item1' },
          { name: 'item2' },
          'plainString',
        ],
        nested: {
          level2: {
            validProp: 'preserved',
          },
        },
      });
    });
  });

  describe('createLimiter', () => {
    it('creates a rate limit handler instance with configured options', () => {
      const customLimiter = createLimiter({ max: 10 });
      expect(customLimiter).toBeDefined();
      expect(typeof customLimiter).toBe('function');
    });
  });
});
