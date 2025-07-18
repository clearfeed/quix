import { AssetPandaService } from './index';
import { AssetPandaConfig } from './types';

describe('AssetPanda Integration', () => {
  let service: AssetPandaService;
  let config: AssetPandaConfig;

  beforeAll(() => {
    // Check if API key is provided
    const apiKey = process.env.ASSETPANDA_API_KEY;
    if (!apiKey) {
      throw new Error('ASSETPANDA environment variable is required for integration tests');
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
      const result = await service.listGroups({ limit: 10 });
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
        name: `Minimal User ${timestamp}`,
        email: `minimal.user.${timestamp}@example.com`,
        employee_id: `EMP${timestamp}`
      };
      const result = await service.createEmployee(employeeData);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.id).toBeDefined();
        expect(result.data.display_name).toContain('Minimal User');
      }
    });
  });
  describe('Object Management', () => {
    it('should create object in group', async () => {
      // Create object with minimal fields - just field_1 works
      const timestamp = Date.now();
      const objectData = {
        group_name: 'Assets',
        fields: {
          field_1: `Test Asset ${timestamp}`
        }
      };
      const result = await service.createObject(objectData);
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.id).toBeDefined();
        expect(result.data.display_name).toBe(`Test Asset ${timestamp}`);
      }
    });
    it('should create minimal asset (only field_1)', async () => {
      const timestamp = Date.now();
      const objectData = {
        group_name: 'Assets',
        fields: {
          field_1: `Minimal Asset ${timestamp}`
        }
      };
      const result = await service.createObject(objectData);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.id).toBeDefined();
        expect(result.data.display_name).toBe(`Minimal Asset ${timestamp}`);
      }
    });
  });
  describe('Asset Management', () => {
    it('should reserve asset', async () => {
      // Use an existing asset name from the group
      const assetData = {
        asset_name: 'HDMI-12',
        group_name: 'Assets'
      };
      const result = await service.reserveAsset(assetData);
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
    });

    it('should assign asset to user (employee object)', async () => {
      // Use an existing asset and employee
      const assignmentData = {
        asset_name: 'HDMI-12',
        employee_email: 'amysmith@email.com',
        group_name: 'Assets'
      };
      const result = await service.assignAssetToUser(assignmentData);
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
    });

    it('should mark asset as returned', async () => {
      const returnData = {
        employee_email: 'amysmith@email.com',
        asset_name: 'HDMI-12',
        group_name: 'Assets'
      };
      const result = await service.markAssetReturned(returnData);
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
    });
  });
  describe('License Management', () => {
    it('should assign software license to employee object', async () => {
      const licenseData = {
        license_name: 'Adobe Photoshop',
        employee_email: 'amysmith@email.com',
        group_name: 'Software Licenses'
      };
      const result = await service.assignSoftwareLicense(licenseData);
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
    });
    it('should reclaim software license from employee object', async () => {
      const reclaimData = {
        license_name: 'Adobe Photoshop',
        employee_email: 'amysmith@email.com',
        group_name: 'Software Licenses'
      };
      const result = await service.reclaimSoftwareLicense(reclaimData);
      expect(result.success).toBe(true);
    });
    it('should handle license with no assigned users', async () => {
      // Create a new license object with no assigned users
      const timestamp = Date.now();
      const licenseData = {
        group_name: 'Software Licenses',
        fields: {
          field_1: `NoUserLicense${timestamp}`,
          field_4: `KEY${timestamp}`,
          field_3: 'TestVendor',
          field_10: 'One-Time',
          field_9: 0,
          field_5: 1,
          field_54: { id: '480984', value: 'Active' },
          field_55: new Date().toISOString()
        }
      };
      const createResult = await service.createObject(licenseData);
      expect(createResult.success).toBe(true);
      if (createResult.success && createResult.data) {
        expect(createResult.data.id).toBeDefined();
        expect(createResult.data.display_name).toContain('NoUserLicense');
        // Try to reclaim a user that doesn't exist
        const reclaimResult = await service.reclaimSoftwareLicense({
          license_name: `NoUserLicense${timestamp}`,
          employee_email: 'nonexistent@email.com',
          group_name: 'Software Licenses'
        });
        expect(reclaimResult.success).toBe(false);
      }
    });
  });
  describe('Error Handling', () => {
    it('should fail to reserve non-existent asset', async () => {
      const result = await service.reserveAsset({
        asset_name: 'NonExistentAsset',
        group_name: 'Assets'
      });
      expect(result.success).toBe(false);
    });
    it('should fail to assign asset to non-existent employee', async () => {
      const result = await service.assignAssetToUser({
        asset_name: 'HDMI-12',
        employee_email: 'notfound@email.com',
        group_name: 'Assets'
      });
      expect(result.success).toBe(false);
    });
    it('should fail to assign non-existent license', async () => {
      const result = await service.assignSoftwareLicense({
        license_name: 'NonExistentLicense',
        employee_email: 'amysmith@email.com',
        group_name: 'Software Licenses'
      });
      expect(result.success).toBe(false);
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
        name: `EmployeeObj${timestamp}`,
        email: `employeeobj.${timestamp}@example.com`,
        employee_id: `EMP${timestamp}`
      };
      const result = await service.createEmployee(employeeData);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.id).toBeDefined();
        expect(result.data.display_name).toContain('EmployeeObj');
      }
    });
  });
});
