import { extractPrimitives, validateRequiredFields } from './utils';

describe('JumpCloud Utils Unit Tests', () => {
  describe('extractPrimitives', () => {
    it('should return null for null input', () => {
      expect(extractPrimitives(null)).toBeNull();
    });

    it('should return undefined for undefined input', () => {
      expect(extractPrimitives(undefined)).toBeUndefined();
    });

    it('should return primitive values as-is', () => {
      expect(extractPrimitives('string')).toBe('string');
      expect(extractPrimitives(42)).toBe(42);
      expect(extractPrimitives(true)).toBe(true);
      expect(extractPrimitives(false)).toBe(false);
    });

    it('should extract primitives from simple objects', () => {
      const input = { name: 'John', age: 30, active: true };
      const result = extractPrimitives(input);
      expect(result).toEqual({ name: 'John', age: 30, active: true });
    });

    it('should handle nested objects with primitives', () => {
      const input = {
        name: 'John',
        age: 30,
        metadata: { created: '2024-01-01', updated: '2024-01-02' },
        tags: ['user', 'admin']
      };
      const result = extractPrimitives(input);
      expect(result).toEqual({
        name: 'John',
        age: 30,
        metadata: { created: '2024-01-01', updated: '2024-01-02' },
        tags: ['user', 'admin']
      });
    });

    it('should handle arrays of primitives', () => {
      const input = { tags: ['user', 'admin'], numbers: [1, 2, 3] };
      const result = extractPrimitives(input);
      expect(result).toEqual({ tags: ['user', 'admin'], numbers: [1, 2, 3] });
    });

    it('should handle arrays with mixed types', () => {
      const input = {
        items: ['simple', { complex: 'object' }, 42, null]
      };
      const result = extractPrimitives(input);
      expect(result.items).toEqual(['simple', { complex: 'object' }, 42, null]);
    });

    it('should handle deeply nested objects', () => {
      const input = {
        level1: {
          level2: {
            level3: 'value'
          },
          simple: 'string'
        },
        primitive: 42
      };
      const result = extractPrimitives(input);
      expect(result).toEqual({
        level1: {
          level2: {
            level3: 'value'
          },
          simple: 'string'
        },
        primitive: 42
      });
    });

    it('should handle empty objects', () => {
      const input = {};
      const result = extractPrimitives(input);
      expect(result).toBeUndefined();
    });

    it('should handle objects with null and undefined values', () => {
      const input = {
        name: 'John',
        nullValue: null,
        undefinedValue: undefined,
        emptyString: ''
      };
      const result = extractPrimitives(input);
      expect(result).toEqual({
        name: 'John',
        nullValue: null,
        undefinedValue: undefined,
        emptyString: ''
      });
    });
  });

  describe('validateRequiredFields', () => {
    it('should not throw for valid params with all required fields', () => {
      const params = { name: 'John', email: 'john@example.com' };
      const requiredFields = ['name', 'email'];

      expect(() => validateRequiredFields({ params, requiredFields })).not.toThrow();
    });

    it('should throw error for missing required fields', () => {
      const params = { name: 'John' };
      const requiredFields = ['name', 'email'];

      expect(() => validateRequiredFields({ params, requiredFields })).toThrow(
        'Missing required fields: email'
      );
    });

    it('should throw error for multiple missing required fields', () => {
      const params = { name: 'John' };
      const requiredFields = ['name', 'email', 'age'];

      expect(() => validateRequiredFields({ params, requiredFields })).toThrow(
        'Missing required fields: email, age'
      );
    });

    it('should handle nested field validation', () => {
      const params = { user: { name: 'John', profile: { email: 'john@example.com' } } };
      const requiredFields = ['user.name', 'user.profile.email'];

      expect(() => validateRequiredFields({ params, requiredFields })).not.toThrow();
    });

    it('should throw for missing nested fields', () => {
      const params = { user: { name: 'John' } };
      const requiredFields = ['user.name', 'user.profile.email'];

      expect(() => validateRequiredFields({ params, requiredFields })).toThrow(
        'Missing required fields: user.profile.email'
      );
    });

    it('should handle mixed nested and flat fields', () => {
      const params = { name: 'John', user: { profile: { email: 'john@example.com' } } };
      const requiredFields = ['name', 'user.profile.email', 'age'];

      expect(() => validateRequiredFields({ params, requiredFields })).toThrow(
        'Missing required fields: age'
      );
    });

    it('should handle empty required fields array', () => {
      const params = { name: 'John' };
      const requiredFields: string[] = [];

      expect(() => validateRequiredFields({ params, requiredFields })).not.toThrow();
    });

    it('should handle undefined values as missing', () => {
      const params = { name: 'John', email: undefined };
      const requiredFields = ['name', 'email'];

      expect(() => validateRequiredFields({ params, requiredFields })).toThrow(
        'Missing required fields: email'
      );
    });

    it('should handle null values as valid (not missing)', () => {
      const params = { name: 'John', email: null };
      const requiredFields = ['name', 'email'];

      // null values should be considered valid, only undefined is missing
      expect(() => validateRequiredFields({ params, requiredFields })).not.toThrow();
    });

    it('should handle deeply nested missing fields', () => {
      const params = {
        user: {
          profile: {
            personal: { name: 'John' }
          }
        }
      };
      const requiredFields = ['user.profile.personal.name', 'user.profile.contact.email'];

      expect(() => validateRequiredFields({ params, requiredFields })).toThrow(
        'Missing required fields: user.profile.contact.email'
      );
    });

    it('should handle empty string values as valid', () => {
      const params = { name: 'John', email: '' };
      const requiredFields = ['name', 'email'];

      // Empty strings should be considered valid values, not missing
      expect(() => validateRequiredFields({ params, requiredFields })).not.toThrow();
    });

    it('should handle zero values as valid', () => {
      const params = { name: 'John', age: 0 };
      const requiredFields = ['name', 'age'];

      // Zero should be considered a valid value, not missing
      expect(() => validateRequiredFields({ params, requiredFields })).not.toThrow();
    });

    it('should handle false values as valid', () => {
      const params = { name: 'John', active: false };
      const requiredFields = ['name', 'active'];

      // False should be considered a valid value, not missing
      expect(() => validateRequiredFields({ params, requiredFields })).not.toThrow();
    });
  });
});
