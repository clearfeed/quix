# JumpCloud Agent Package

A TypeScript package for interacting with the JumpCloud API, providing user and group management capabilities.

## Features

- **User Management**: Create, read, update, delete, and list users
- **Group Management**: Create, delete, and list groups
- **Group Membership**: Assign and unassign users to/from groups
- **Device Management**: List devices assigned to users and all devices in the organization
- **Error Handling**: Comprehensive error handling with detailed error messages
- **Type Safety**: Full TypeScript support with proper type definitions
- **Tool Integration**: LangChain-compatible tools for AI agents

## Installation

```bash
yarn add @clearfeed-ai/quix-jumpcloud-agent
```

## Usage

### Basic Setup

```typescript
import { JumpCloudService } from '@clearfeed-ai/quix-jumpcloud-agent';

const service = new JumpCloudService({
  apiKey: 'your-jumpcloud-api-key',
  baseUrl: 'https://console.jumpcloud.com/api' // optional, defaults to this value
});
```

### User Management

```typescript
// List users
const users = await service.listUsers({ limit: 10, query: 'admin' });

// Create a user
const newUser = await service.createUser({
  username: 'john.doe',
  email: 'john.doe@example.com',
  firstname: 'John',
  lastname: 'Doe'
});

// Get a specific user
const user = await service.getUser({ userId: 'user-id' });

// Update a user
const updatedUser = await service.updateUser({
  userId: 'user-id',
  payload: { firstname: 'Jane' }
});

// Delete a user
const deleteResult = await service.deleteUser({ userId: 'user-id' });
```

### Group Management

```typescript
// List groups
const groups = await service.listGroups({ limit: 10 });

// Create a group
const newGroup = await service.createGroup({
  name: 'Developers',
  description: 'Development team group'
});

// Assign user to group
const assignResult = await service.assignUserToGroup({
  userId: 'user-id',
  groupId: 'group-id'
});

// List users in a group
const groupUsers = await service.listGroupUsers({ groupId: 'group-id' });

// Remove user from group
const unassignResult = await service.unassignUserFromGroup({
  userId: 'user-id',
  groupId: 'group-id'
});

// Delete a group
const deleteGroupResult = await service.deleteGroup({ groupId: 'group-id' });
```

### Device Management

```typescript
// List devices for a specific user
const userDevices = await service.listUserDevices({ userId: 'user-id' });

// List all devices in the organization
const allDevices = await service.listDevices({ limit: 50 });

// Search for devices
const searchResults = await service.listDevices({
  limit: 20,
  query: 'MacBook'
});
```

### Using with LangChain Tools

```typescript
import { createJumpCloudToolsExport } from '@clearfeed-ai/quix-jumpcloud-agent';

const toolConfig = createJumpCloudToolsExport({
  apiKey: 'your-jumpcloud-api-key'
});

// Use with LangChain agents
const tools = toolConfig.tools;
const prompts = toolConfig.prompts;
```

## Testing

This package includes comprehensive tests that can run against a real JumpCloud API or as unit tests.

### Prerequisites

1. **JumpCloud API Key**: You need a valid JumpCloud API key to run integration tests
2. **Node.js**: Version 18 or higher
3. **Yarn**: Package manager

### Setting Up Tests

1. **Install dependencies**:

   ```bash
   cd agent-packages/packages/jumpcloud
   yarn install
   ```

2. **Create environment file**:
   Create a `.env` file in the jumpcloud package root:

   ```bash
   # JumpCloud API Configuration
   JUMPCLOUD_API_KEY=your_jumpcloud_api_key_here
   JUMPCLOUD_BASE_URL=https://console.jumpcloud.com/api

   # Test Configuration (optional)
   TEST_USER_PREFIX=test-user-
   TEST_GROUP_PREFIX=test-group-
   ```

3. **Get your JumpCloud API Key**:
   - Log into your JumpCloud Admin Console
   - Go to Settings → API Keys
   - Create a new API key with appropriate permissions
   - Copy the API key to your `.env` file

### Running Tests

#### All Tests

```bash
yarn test
```

#### Unit Tests Only

```bash
yarn test utils.spec.ts
```

#### Integration Tests Only

```bash
yarn test:integration
```

#### Specific Test Files

```bash
# Test the main service
yarn test integration.spec.ts

# Test the tools
yarn test tools.spec.ts

# Test utilities
yarn test utils.spec.ts
```

#### With Coverage

```bash
yarn test --coverage
```

### Test Structure

The test suite includes:

1. **Unit Tests** (`utils.spec.ts`):

   - Tests utility functions without API calls
   - Fast execution, no external dependencies

2. **Integration Tests** (`integration.spec.ts`):

   - Tests all service methods with real API calls
   - Creates and cleans up test resources
   - Comprehensive error handling tests

3. **Tool Tests** (`tools.spec.ts`):
   - Tests LangChain tool integration
   - Schema validation tests
   - Tool execution with real API calls

### Test Safety

The integration tests are designed to be safe:

- **Unique Naming**: Test resources use timestamps to avoid conflicts
- **Automatic Cleanup**: Tests clean up created resources automatically
- **Error Handling**: Graceful handling of API errors and failures
- **Prefixed Resources**: Test users and groups are prefixed for easy identification

### Test Output

Tests provide detailed console output showing:

- API call results
- Created resource IDs
- Cleanup operations
- Error messages for expected failures

### Environment Variables

| Variable             | Description            | Default                             | Required                    |
| -------------------- | ---------------------- | ----------------------------------- | --------------------------- |
| `JUMPCLOUD_API_KEY`  | Your JumpCloud API key | -                                   | Yes (for integration tests) |
| `JUMPCLOUD_BASE_URL` | JumpCloud API base URL | `https://console.jumpcloud.com/api` | No                          |
| `TEST_USER_PREFIX`   | Prefix for test users  | `test-user-`                        | No                          |
| `TEST_GROUP_PREFIX`  | Prefix for test groups | `test-group-`                       | No                          |

## API Reference

### JumpCloudService

The main service class that provides methods for interacting with JumpCloud.

#### Constructor

```typescript
new JumpCloudService(config: JumpCloudConfig)
```

#### Methods

- `listUsers(params)`: List users with optional filtering
- `createUser(args)`: Create a new user
- `getUser(args)`: Get a specific user by ID
- `updateUser(args)`: Update user properties
- `deleteUser(args)`: Delete a user
- `listGroups(params)`: List groups with optional filtering
- `createGroup(args)`: Create a new group
- `assignUserToGroup(args)`: Add user to group
- `unassignUserFromGroup(args)`: Remove user from group
- `listGroupUsers(args)`: List users in a group
- `deleteGroup(args)`: Delete a group
- `listUserDevices(args)`: List devices assigned to a specific user
- `listDevices(params)`: List all devices with optional filtering

All methods return a promise that resolves to a response object with:

- `success`: Boolean indicating if the operation was successful
- `data`: The response data (if successful)
- `error`: Error message (if unsuccessful)

## Development

### Building

```bash
yarn build
```

### Cleaning

```bash
yarn clean
```

### Contributing

1. Follow the existing code style
2. Add tests for new functionality
3. Ensure all tests pass
4. Update documentation as needed

## License

Apache-2.0
