import { extractPrimitives, extractErrorMessage } from './utils';

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

  describe('extractErrorMessage', () => {
    it('should extract string error message from Axios response data', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: 'Path `username` is required.',
          status: 400,
          statusText: 'Bad Request'
        }
      };

      expect(extractErrorMessage(axiosError)).toBe('Path `username` is required.');
    });

    it('should extract error message from object response data with error.message field', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            error: {
              message: 'Invalid username format'
            }
          },
          status: 400
        }
      };

      expect(extractErrorMessage(axiosError)).toBe('Invalid username format');
    });

    it('should extract error message from object response data with error field', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            error: 'User not found'
          },
          status: 404
        }
      };

      expect(extractErrorMessage(axiosError)).toBe('User not found');
    });

    it('should extract error message from object response data with message field', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            message: 'Authentication failed'
          },
          status: 401
        }
      };

      expect(extractErrorMessage(axiosError)).toBe('Authentication failed');
    });

    it('should extract error message from object response data with detail field', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            detail: 'Rate limit exceeded'
          },
          status: 429
        }
      };

      expect(extractErrorMessage(axiosError)).toBe('Rate limit exceeded');
    });

    it('should extract error message from object response data with details field', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            details: 'Invalid API key provided'
          },
          status: 403
        }
      };

      expect(extractErrorMessage(axiosError)).toBe('Invalid API key provided');
    });

    it('should JSON stringify complex response data when no standard fields are found', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            code: 'VALIDATION_ERROR',
            fields: ['username', 'email']
          },
          status: 400
        }
      };

      expect(extractErrorMessage(axiosError)).toBe(
        '{"code":"VALIDATION_ERROR","fields":["username","email"]}'
      );
    });

    it('should handle Axios error with status code but no response data', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          statusText: 'Internal Server Error'
        }
      };

      expect(extractErrorMessage(axiosError)).toBe(
        'Request failed with status code 500 Internal Server Error'
      );
    });

    it('should handle Axios error with status code but no statusText', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 404
        }
      };

      expect(extractErrorMessage(axiosError)).toBe('Request failed with status code 404');
    });

    it('should handle Axios network errors with error code', () => {
      const axiosError = {
        isAxiosError: true,
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      };

      expect(extractErrorMessage(axiosError)).toBe(
        'Network error: ECONNREFUSED - Connection refused'
      );
    });

    it('should handle standard Error objects', () => {
      const standardError = new Error('Something went wrong');

      expect(extractErrorMessage(standardError)).toBe('Something went wrong');
    });

    it('should handle unknown error types', () => {
      const unknownError = { someProperty: 'value' };

      expect(extractErrorMessage(unknownError)).toBe('An unknown error occurred');
    });

    it('should handle null or undefined errors', () => {
      expect(extractErrorMessage(null)).toBe('An unknown error occurred');
      expect(extractErrorMessage(undefined)).toBe('An unknown error occurred');
    });

    it('should handle string errors', () => {
      expect(extractErrorMessage('Simple string error')).toBe('An unknown error occurred');
    });

    it('should prioritize error.message over other fields', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            error: {
              message: 'Specific error message'
            },
            message: 'General message',
            detail: 'Some detail'
          },
          status: 400
        }
      };

      expect(extractErrorMessage(axiosError)).toBe('Specific error message');
    });

    it('should fallback through error field hierarchy', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            message: 'Fallback message',
            detail: 'Some detail'
          },
          status: 400
        }
      };

      expect(extractErrorMessage(axiosError)).toBe('Fallback message');
    });
  });
});
