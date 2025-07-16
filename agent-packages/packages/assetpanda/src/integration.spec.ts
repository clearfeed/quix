import { AssetPandaService } from './index';
import { AssetPandaConfig } from './types';

describe('AssetPanda Integration', () => {
  let service: AssetPandaService;
  let config: AssetPandaConfig;

  beforeAll(() => {
    config = {
      apiToken: process.env.ASSETPANDA_API_TOKEN || 'test-token',
      baseUrl: process.env.ASSETPANDA_API_URL || 'https://api.assetpanda.com'
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
    it('should list users', async () => {
      const result = await service.listUsers({ limit: 10 });
      expect(result).toHaveProperty('success');
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });

    it('should list groups', async () => {
      const result = await service.listGroups({ limit: 10 });
      expect(result).toHaveProperty('success');
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('Employee Management', () => {
    it('should create employee with valid data', async () => {
      const employeeData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        create_for_account: '123456'
      };

      const result = await service.createEmployee(employeeData);
      expect(result).toHaveProperty('success');
    });
  });

  describe('Asset Management', () => {
    it('should reserve asset', async () => {
      const assetData = {
        asset_name: 'MacBook Pro',
        group_name: 'Hardware'
      };

      const result = await service.reserveAsset(assetData);
      expect(result).toHaveProperty('success');
    });

    it('should assign asset to user', async () => {
      const assignmentData = {
        asset_name: 'MacBook Pro',
        employee_email: 'john.doe@example.com',
        group_name: 'Hardware'
      };

      const result = await service.assignAssetToUser(assignmentData);
      expect(result).toHaveProperty('success');
    });

    it('should mark asset as returned', async () => {
      const returnData = {
        employee_email: 'john.doe@example.com',
        asset_name: 'MacBook Pro',
        group_name: 'Hardware'
      };

      const result = await service.markAssetReturned(returnData);
      expect(result).toHaveProperty('success');
    });
  });

  describe('License Management', () => {
    it('should assign software license', async () => {
      const licenseData = {
        license_name: 'Figma',
        employee_email: 'john.doe@example.com',
        group_name: 'Licenses'
      };

      const result = await service.assignSoftwareLicense(licenseData);
      expect(result).toHaveProperty('success');
    });

    it('should reclaim software license', async () => {
      const reclaimData = {
        license_name: 'Figma',
        employee_email: 'john.doe@example.com',
        group_name: 'Licenses'
      };

      const result = await service.reclaimSoftwareLicense(reclaimData);
      expect(result).toHaveProperty('success');
    });
  });
});
