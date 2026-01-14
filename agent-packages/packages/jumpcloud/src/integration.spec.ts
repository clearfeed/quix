import { JumpCloudService } from './index';
import { JumpCloudConfig } from './types';

describe('JumpCloud Integration Tests', () => {
  let service: JumpCloudService;
  let config: JumpCloudConfig;
  let testUserId: string | null = null;
  let testGroupId: string | null = null;

  const TEST_USER_PREFIX = process.env.TEST_USER_PREFIX || 'test-user-';
  const TEST_GROUP_PREFIX = process.env.TEST_GROUP_PREFIX || 'test-group-';
  const timestamp = Date.now();

  beforeAll(() => {
    // Check if API key is provided
    const apiKey = process.env.JUMPCLOUD_API_KEY;
    const baseUrl = process.env.JUMPCLOUD_BASE_URL;
    if (!apiKey) {
      throw new Error('JUMPCLOUD_API_KEY environment variable is required for integration tests');
    }
    if (!baseUrl) {
      throw new Error('JUMPCLOUD_BASE_URL environment variable is required for integration tests');
    }

    config = {
      apiKey,
      baseUrl
    };

    service = new JumpCloudService(config);
  });

  afterAll(async () => {
    // Cleanup: Delete test user and group if they were created
    if (testUserId) {
      try {
        await service.deleteUser({ userId: testUserId });
        console.log(`Cleaned up test user: ${testUserId}`);
      } catch (error) {
        console.warn(`Failed to cleanup test user ${testUserId}:`, error);
      }
    }

    if (testGroupId) {
      try {
        await service.deleteGroup({ groupId: testGroupId });
        console.log(`Cleaned up test group: ${testGroupId}`);
      } catch (error) {
        console.warn(`Failed to cleanup test group ${testGroupId}:`, error);
      }
    }
  });

  describe('User Management', () => {
    // Generate test username and email at the describe block level for reuse
    const testUsername = `${TEST_USER_PREFIX}${timestamp}`;
    const testEmail = `${testUsername}@example.com`;

    it('should list users successfully', async () => {
      const result = await service.listUsers({ limit: 20, query: undefined });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      console.log(`Found ${result.data?.length || 0} users`);
    });

    it('should list users with query parameter', async () => {
      const result = await service.listUsers({ limit: 20, query: 'admin' });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      console.log(`Found ${result.data?.length || 0} users matching 'admin'`);
    });

    it('should list users with limit parameter', async () => {
      const result = await service.listUsers({ limit: 5, query: undefined });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.length).toBeLessThanOrEqual(5);

      console.log(`Found ${result.data?.length || 0} users with limit 5`);
    });

    it('should create a new user', async () => {
      const result = await service.createUser({
        username: testUsername,
        email: testEmail,
        firstname: 'Test',
        lastname: 'User'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.username).toBe(testUsername);
      expect(result.data?.email).toBe(testEmail);

      testUserId = result.data?.id || '';
      console.log(`Created test user with ID: ${testUserId}`);
    });

    it('should get the created user', async () => {
      if (!testUserId) {
        throw new Error('Test user was not created');
      }

      const result = await service.getUser({ userId: testUserId });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(testUserId);
      expect(result.data?.username).toContain(TEST_USER_PREFIX);

      console.log(`Retrieved user: ${result.data?.username}`);
    });

    it('should update the created user', async () => {
      if (!testUserId) {
        throw new Error('Test user was not created');
      }

      const updatedEmail = `updated-${testUsername}@example.com`;
      const result = await service.updateUser({
        userId: testUserId,
        payload: {
          firstname: 'Updated',
          lastname: 'TestUser',
          email: updatedEmail
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.firstname).toBe('Updated');
      expect(result.data?.lastname).toBe('TestUser');
      expect(result.data?.email).toBe(updatedEmail);

      console.log(`Updated user: ${result.data?.username} with email: ${result.data?.email}`);
    });

    it('should handle get user with invalid ID', async () => {
      const result = await service.getUser({ userId: 'invalid-user-id' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      console.log(`Expected error for invalid user ID: ${result.error}`);
    });
  });

  describe('Group Management', () => {
    it('should list groups successfully', async () => {
      const result = await service.listGroups({ limit: 20, query: undefined });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      console.log(`Found ${result.data?.length || 0} groups`);
    });

    it('should list groups with query parameter', async () => {
      const result = await service.listGroups({ limit: 20, query: 'admin' });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      console.log(`Found ${result.data?.length || 0} groups matching 'admin'`);
    });

    it('should create a new group', async () => {
      const testGroupName = `${TEST_GROUP_PREFIX}${timestamp}`;

      const result = await service.createGroup({
        name: testGroupName,
        description: 'Test group for integration testing'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe(testGroupName);

      testGroupId = result.data?.id || '';
      console.log(`Created test group with ID: ${testGroupId}`);
    });

    it('should list users in the created group (should be empty)', async () => {
      if (!testGroupId) {
        throw new Error('Test group was not created');
      }

      const result = await service.listGroupUsers({ groupId: testGroupId });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.length).toBe(0);

      console.log(`Group has ${result.data?.length || 0} users`);
    });

    it('should assign user to group', async () => {
      if (!testUserId || !testGroupId) {
        throw new Error('Test user or group was not created');
      }

      const result = await service.assignUserToGroup({
        userId: testUserId,
        groupId: testGroupId
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');

      console.log(`Assigned user to group: ${result.data}`);
    });

    it('should list users in group after assignment', async () => {
      if (!testGroupId) {
        throw new Error('Test group was not created');
      }

      const result = await service.listGroupUsers({ groupId: testGroupId });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.length).toBe(1);
      if (result.data && result.data[0]) {
        // JumpCloud group members API may return user objects with different ID field structure
        const userObj = result.data[0] as any;
        const userId = userObj.id || userObj._id || userObj.userId || userObj.to?.id;
        expect(userId).toBe(testUserId);
      }

      console.log(`Group now has ${result.data?.length || 0} users`);
    });

    it('should unassign user from group', async () => {
      if (!testUserId || !testGroupId) {
        throw new Error('Test user or group was not created');
      }

      const result = await service.unassignUserFromGroup({
        userId: testUserId,
        groupId: testGroupId
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');

      console.log(`Unassigned user from group: ${result.data}`);
    });

    it('should list users in group after unassignment (should be empty)', async () => {
      if (!testGroupId) {
        throw new Error('Test group was not created');
      }

      const result = await service.listGroupUsers({ groupId: testGroupId });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.length).toBe(0);

      console.log(`Group now has ${result.data?.length || 0} users after unassignment`);
    });

    it('should handle invalid group operations', async () => {
      const result = await service.listGroupUsers({ groupId: 'invalid-group-id' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      console.log(`Expected error for invalid group ID: ${result.error}`);
    });
  });

  describe('Device Management', () => {
    it('should list devices for a user', async () => {
      if (!testUserId) {
        console.warn('Skipping test: Test user was not created');
        return;
      }

      const result = await service.listUserDevices({ userId: testUserId });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      console.log(`Found ${result.data?.length || 0} devices for user`);
    });

    it('should list all devices', async () => {
      const result = await service.listDevices({ limit: 10, query: undefined });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      console.log(`Found ${result.data?.length || 0} devices`);
    });

    it('should list devices with query parameter', async () => {
      const result = await service.listDevices({ limit: 10, query: 'test' });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      console.log(`Found ${result.data?.length || 0} devices matching 'test'`);
    });

    it('should handle invalid user ID for device listing', async () => {
      const result = await service.listUserDevices({ userId: 'invalid-user-id' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Not Found');

      console.log(`Expected error for invalid user ID: ${result.error}`);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid API key gracefully', async () => {
      const invalidService = new JumpCloudService({
        apiKey: 'invalid-api-key',
        baseUrl: 'does-not-matter'
      });

      const result = await invalidService.listUsers({ limit: 20, query: undefined });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      console.log(`Expected error for invalid API key: ${result.error}`);
    });

    it('should handle network errors gracefully', async () => {
      const networkErrorService = new JumpCloudService({
        apiKey: config.apiKey,
        baseUrl: 'does-not-matter'
      });

      const result = await networkErrorService.listUsers({ limit: 20, query: undefined });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      console.log(`Expected network error: ${result.error}`);
    });

    it('should handle malformed requests', async () => {
      const result = await service.createUser({
        username: '', // Invalid empty username
        email: 'invalid-email', // Invalid email format,
        firstname: undefined,
        lastname: undefined
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      console.log(`Expected validation error: ${result.error}`);
    });
  });

  describe('Cleanup Operations', () => {
    it('should delete the test user', async () => {
      if (!testUserId) {
        throw new Error('Test user was not created');
      }

      const result = await service.deleteUser({ userId: testUserId });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');

      console.log(`Deleted test user: ${result.data}`);
      testUserId = null; // Prevent cleanup in afterAll
    });

    it('should delete the test group', async () => {
      if (!testGroupId) {
        throw new Error('Test group was not created');
      }

      const result = await service.deleteGroup({ groupId: testGroupId });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');

      console.log(`Deleted test group: ${result.data}`);
      testGroupId = null; // Prevent cleanup in afterAll
    });

    it('should handle delete operations on non-existent resources', async () => {
      const result = await service.deleteUser({ userId: 'non-existent-user-id' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      console.log(`Expected error for deleting non-existent user: ${result.error}`);
    });
  });
});
