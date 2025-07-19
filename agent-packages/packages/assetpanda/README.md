# AssetPanda Integration for Quix

This package provides integration with AssetPanda, an asset management platform, for the Quix AI agent system.

## Features

### v1 Scope Implementation

- **Create Employee Record**: Add new employees to AssetPanda
- **Reserve Asset**: Mark assets as reserved for future assignment
- **Assign Asset to User**: Allocate hardware assets to specific employees
- **Mark Asset as Returned**: Unassign assets and mark them as available
- **Assign Software License**: Allocate software licenses to employees
- **Reclaim/Deallocate Software License**: Free up license seats from employees

### Additional Features

- **Check Asset Availability**: Search for available assets by type
- **List Groups**: View all asset groups (Hardware, Licenses, etc.)
- **List Users**: View all employees in the system
- **Search Objects**: Advanced search for assets and licenses

## Installation

```bash
yarn add @clearfeed-ai/quix-assetpanda-agent
```

## Configuration

### Environment Variables

Add the following to your environment configuration:

```env
ASSETPANDA_API_TOKEN=your_api_token_here
```

### Configuration Object

```typescript
import { AssetPandaConfig } from '@clearfeed-ai/quix-assetpanda-agent';

const config: AssetPandaConfig = {
  apiToken: 'your_api_token_here',
  enabled: true
};
```

## Usage

### Basic Setup

```typescript
import {
  AssetPandaService,
  createAssetPandaToolsExport
} from '@clearfeed-ai/quix-assetpanda-agent';

// Create service instance
const service = new AssetPandaService(config);

// Create tools for the agent
const tools = createAssetPandaToolsExport(config);
```

### Tool Examples

#### Create Employee

```typescript
const result = await service.createEmployee({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@company.com',
  password: 'securepassword',
  password_confirmation: 'securepassword',
  create_for_account: '123456'
});
```

#### Reserve Asset

```typescript
const result = await service.reserveAsset({
  asset_name: 'MacBook Pro 16"',
  group_name: 'Hardware'
});
```

#### Assign Asset to User

```typescript
const result = await service.assignAssetToUser({
  asset_name: 'MacBook Pro 16"',
  employee_email: 'john.doe@company.com',
  group_name: 'Hardware'
});
```

#### Assign Software License

```typescript
const result = await service.assignSoftwareLicense({
  license_name: 'Figma Professional',
  employee_email: 'john.doe@company.com',
  group_name: 'Licenses'
});
```

## API Endpoints Used

This integration uses the following AssetPanda API endpoints:

- `GET /users` - List users
- `POST /users` - Create user
- `GET /groups` - List groups
- `POST /groups/{group_id}/objects/search` - Search objects
- `PATCH /groups/{group_id}/objects/{object_id}` - Update object

All endpoints are accessed via the base URL: `https://api.assetpanda.com/v3`

## Asset Groups

The integration works with different asset groups in AssetPanda:

- **Hardware/Assets**: Physical assets like laptops, monitors, etc.
- **Licenses**: Software licenses with seat management
- **Employees**: User records for employees

## Error Handling

All operations return a standardized response format:

```typescript
interface BaseResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## Testing

Run the test suite:

```bash
yarn test
```

Run integration tests:

```bash
yarn test:integration
```

## Building

Build the package:

```bash
yarn build
```

## Development

### Project Structure

```
src/
├── index.ts          # Main service implementation
├── tools.ts          # Tool definitions for the agent
├── types.ts          # TypeScript interfaces
├── schema.ts         # Zod schemas for validation
├── test-setup.ts     # Test configuration
└── integration.spec.ts # Integration tests
```

### Adding New Features

1. Add new types to `types.ts`
2. Add Zod schemas to `schema.ts`
3. Implement API methods in `index.ts`
4. Create tools in `tools.ts`
5. Add tests in `integration.spec.ts`

## License

Apache-2.0
