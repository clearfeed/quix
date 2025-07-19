import { AssetPandaService } from './index';
import { AssetPandaConfig } from './types';

describe('AssetPanda Integration', () => {
  let service: AssetPandaService;
  let config: AssetPandaConfig;

  beforeAll(() => {
    // Check if API key is provided
    const apiKey = process.env.ASSETPANDA_API_KEY;
    if (!apiKey) {
      throw new Error(
        'ASSETPANDA_API_TOKEN environment variable is required for integration tests'
      );
    }

    config = {
      apiToken: apiKey
    };
    service = new AssetPandaService(config);
  });

  describe('Configuration', () => {
    it('should validate config with valid API token', () => {
      const validConfig = { apiToken: 'valid-token' };
      const validation = service.validateConfig(validConfig);
      expect(validation.isValid).toBe(true);
    });

    it('should reject config without API token', () => {
      const invalidConfig = {};
      const validation = service.validateConfig(invalidConfig);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('AssetPanda API token is required');
    });
  });
  describe('API Endpoints', () => {
    it('should get settings', async () => {
      const result = await service.getSettings();
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('settings');
      }
    });

    it('should get current user', async () => {
      const result = await service.getCurrentUser();
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('account_id');
      }
    });

    it('should list users', async () => {
      const result = await service.listUsers({ limit: 10 });
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });

    it('should list groups', async () => {
      const result = await service.listGroups();
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });
  describe('Employee Management', () => {
    it('should create minimal employee (no status)', async () => {
      const timestamp = Date.now();
      const employeeData = {
        first_name: `Minimal`,
        last_name: `User${timestamp}`,
        email: `minimal.user.${timestamp}@example.com`,
        password: `TestPassword123!`
      };
      const result = await service.createEmployee(employeeData);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.id).toBeDefined();
      }
    });
  });
  describe('User vs Employee Creation', () => {
    it('should create a new API user via /users endpoint', async () => {
      const timestamp = Date.now();
      const userData = {
        first_name: `APIUser${timestamp}`,
        last_name: `Test${timestamp}`,
        email: `apiuser.${timestamp}@example.com`,
        password: 'TestPassword123!',
        password_confirmation: 'TestPassword123!',
        create_for_account: undefined,
        device: 'web'
      };
      const result = await service.createUser(userData);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.id).toBeDefined();
        expect(result.data.email).toBe(userData.email);
      }
    });
    it('should create a new employee object in Employees group', async () => {
      const timestamp = Date.now();
      const employeeData = {
        first_name: `EmployeeObj${timestamp}`,
        last_name: `Test`,
        email: `employeeobj.${timestamp}@example.com`,
        password: `TestPassword123!`
      };
      const result = await service.createEmployee(employeeData);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.id).toBeDefined();
      }
    });
  });
});
