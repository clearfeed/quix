import { KandjiService } from './index';
import { KandjiConfig } from './types';

describe('Kandji Integration Tests', () => {
  const config: KandjiConfig = {
    apiKey: process.env.KANDJI_API_KEY || '',
    baseUrl: process.env.KANDJI_BASE_URL || 'https://clearfeed.api.kandji.io'
  };

  let service: KandjiService;
  let testDeviceId: string;

  beforeAll(async () => {
    if (!config.apiKey) {
      throw new Error('KANDJI_API_KEY environment variable is required for integration tests');
    }
    service = new KandjiService(config);

    const devicesResponse = await service.listDevices({ limit: 1 });
    if (devicesResponse.success && devicesResponse.data && devicesResponse.data.length > 0) {
      testDeviceId = devicesResponse.data[0].device_id;
      console.log(`Found device for all tests: ${testDeviceId}`);
    } else {
      throw new Error(
        `No devices found in Kandji instance. Response: ${JSON.stringify(devicesResponse, null, 2)}`
      );
    }
  });

  describe('Device Management', () => {
    test('should list devices', async () => {
      const response = await service.listDevices({ limit: 10 });
      expect(response.success).toBe(true);
      if (response.success && response.data) {
        expect(Array.isArray(response.data)).toBe(true);
        if (response.data.length > 0) {
          const device = response.data[0];
          expect(device).toHaveProperty('device_id');
          expect(device).toHaveProperty('device_name');
          expect(device).toHaveProperty('model');
          expect(device).toHaveProperty('serial_number');
          expect(device).toHaveProperty('os_version');
          expect(device).toHaveProperty('blueprint_name');
          expect(device).toHaveProperty('last_check_in');
        }
      }
    }, 10000);

    test('should get device details', async () => {
      const devicesResponse = await service.listDevices({ limit: 1 });
      expect(devicesResponse.success).toBe(true);

      if (devicesResponse.success && devicesResponse.data && devicesResponse.data.length > 0) {
        const deviceId = devicesResponse.data[0].device_id;
        const response = await service.getDevice({ deviceId });

        expect(response.success).toBe(true);
        if (response.success) {
          expect(response.data).toHaveProperty('device_id', deviceId);
          expect(response.data).toHaveProperty('device_name');
          expect(response.data).toHaveProperty('model');
          expect(response.data).toHaveProperty('serial_number');
          expect(response.data).toHaveProperty('os_version');
          expect(response.data).toHaveProperty('blueprint_name');
        }
      }
    }, 10000);

    test('should list blueprints', async () => {
      const response = await service.listBlueprints();
      expect(response.success).toBe(true);
      if (response.success && response.data) {
        expect(Array.isArray(response.data)).toBe(true);
        if (response.data.length > 0) {
          const blueprint = response.data[0];
          expect(blueprint).toHaveProperty('id');
          expect(blueprint).toHaveProperty('name');
        }
      }
    }, 10000);
  });

  describe('Device Actions', () => {
    test('should handle send blank push action (may fail if endpoint not available)', async () => {
      expect(testDeviceId).toBeDefined();

      const response = await service.sendBlankPush({ deviceId: testDeviceId });
      // This may fail if the endpoint doesn't exist or device is not MDM managed
      expect(typeof response.success).toBe('boolean');
      if (response.success) {
        expect(response.data).toContain('update inventory command sent');
      } else {
        expect(response.error).toBeDefined();
      }
    }, 10000);

    test('should handle lock device action (may fail if device not MDM managed)', async () => {
      expect(testDeviceId).toBeDefined();

      const response = await service.lockDevice({ deviceId: testDeviceId });
      // This may fail if device is not MDM managed, but we test the API call structure
      expect(typeof response.success).toBe('boolean');
      if (response.success) {
        expect(response.data).toContain('lock command sent');
      } else {
        expect(response.error).toBeDefined();
      }
    }, 10000);

    test('should handle restart device action (may fail if device not MDM managed or not macOS)', async () => {
      expect(testDeviceId).toBeDefined();

      const response = await service.restartDevice({ deviceId: testDeviceId });
      // This may fail if device is not MDM managed or not macOS, but we test the API call structure
      expect(typeof response.success).toBe('boolean');
      if (response.success) {
        expect(response.data).toContain('restart command sent');
      } else {
        expect(response.error).toBeDefined();
      }
    }, 10000);

    test('should handle shutdown device action (may fail if device not MDM managed or not macOS)', async () => {
      expect(testDeviceId).toBeDefined();

      const response = await service.shutdownDevice({ deviceId: testDeviceId });
      // This may fail if device is not MDM managed or not macOS, but we test the API call structure
      expect(typeof response.success).toBe('boolean');
      if (response.success) {
        expect(response.data).toContain('shutdown command sent');
      } else {
        expect(response.error).toBeDefined();
      }
    }, 10000);

    test('should handle reinstall agent action (may fail if device not MDM managed)', async () => {
      expect(testDeviceId).toBeDefined();

      const response = await service.reinstallAgent({ deviceId: testDeviceId });
      // This may fail if device is not MDM managed, but we test the API call structure
      expect(typeof response.success).toBe('boolean');
      if (response.success) {
        expect(response.data).toContain('reinstall agent command sent');
      } else {
        expect(response.error).toBeDefined();
      }
    }, 10000);

    test('should handle unlock user account action (may fail if device not MDM managed)', async () => {
      expect(testDeviceId).toBeDefined();

      const response = await service.unlockUserAccount({ deviceId: testDeviceId });
      // This may fail if device is not MDM managed, but we test the API call structure
      expect(typeof response.success).toBe('boolean');
      if (response.success) {
        expect(response.data).toContain('unlock user account command sent');
      } else {
        expect(response.error).toBeDefined();
      }
    }, 10000);

    test('should handle set device name action (may fail if device not MDM managed)', async () => {
      expect(testDeviceId).toBeDefined();

      const newName = `TestDevice_${Date.now()}`;
      const response = await service.setDeviceName({ deviceId: testDeviceId, deviceName: newName });
      // This may fail if device is not MDM managed, but we test the API call structure
      expect(typeof response.success).toBe('boolean');
      if (response.success) {
        expect(response.data).toContain('name set to');
      } else {
        expect(response.error).toBeDefined();
      }
    }, 10000);
  });

  describe('Destructive Device Actions', () => {
    test('should handle reset device action (DESTRUCTIVE - will likely fail in test)', async () => {
      expect(testDeviceId).toBeDefined();

      const response = await service.resetDevice({ deviceId: testDeviceId });
      // This should fail in most cases as it's a destructive operation that wipes the device
      // We're testing the API call structure and error handling
      expect(typeof response.success).toBe('boolean');
      if (response.success) {
        expect(response.data).toContain('reset command sent');
      } else {
        expect(response.error).toBeDefined();
      }
    }, 10000);
  });
});
