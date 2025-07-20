# BambooHR Integration

A comprehensive integration with BambooHR's API for employee management and time off operations.

## Implemented Tools

### Employee Management

#### `list_bamboohr_employees`

Lists all employees in BambooHR with their basic information including names, job titles, departments, managers, and contact details.

**Parameters:** None

**Returns:** Employee directory with fields definition and employee list

#### `get_bamboohr_employee`

Gets detailed information for a specific employee by their ID, including job title, manager, department, and contact information.

**Parameters:**

- `employeeId` (number): The employee ID to get details for

**Returns:** Employee details object

### Time Off Management

#### `get_bamboohr_employee_time_off_balance`

Gets time off balances for a specific employee, showing available vacation days, sick days, and other leave types with used amounts.

**Parameters:**

- `employeeId` (string): The employee ID to get time off balance for
- `endDate` (string, optional): End date for balance calculation (YYYY-MM-DD format, defaults to current year end)

**Returns:** Array of time off balances by type

#### `get_bamboohr_time_off_requests_for_employee`

Retrieves time off requests with optional filters for date range, and status. Shows request details, dates, amounts, and approval status.

**Parameters:**

- `employeeId` (number, optional): Filter by specific employee ID
- `startDate` (string, optional): Start date filter (YYYY-MM-DD format, defaults to current year start)
- `endDate` (string, optional): End date filter (YYYY-MM-DD format, defaults to current year end)
- `status` (string, optional): Filter by request status ('approved', 'denied', 'superceded', 'requested', 'canceled')

**Returns:** Array of time off requests

#### `create_bamboohr_time_off_request`

Creates a new time off request for an employee. Requires employee ID, time off type, dates, and amount.

**Parameters:**

- `employeeId` (number): The employee ID requesting time off
- `timeOffTypeId` (string): The time off type ID (e.g., "78" for Vacation, "79" for Sick)
- `start` (string): Start date in YYYY-MM-DD format
- `end` (string): End date in YYYY-MM-DD format
- `amount` (string): Amount of time off in hours or days
- `notes` (string, optional): Optional notes for the request

**Returns:** Success confirmation with request ID

## Testing Instructions

1. Set up environment variables:

   ```bash
   export BAMBOOHR_API_KEY="your_api_key_here"
   export BAMBOOHR_SUBDOMAIN="your_subdomain"
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Build the package:

   ```bash
   yarn build
   ```

4. Run integration tests:
   ```bash
   yarn test:integration
   ```

## Configuration

The integration requires a configuration object with the following properties:

```typescript
interface BambooHRConfig {
  apiKey: string; // BambooHR API key
  subdomain: string; // BambooHR company subdomain
  enabled?: boolean; // Whether the integration is enabled (inherited from BaseConfig)
}
```

## Usage Example

```typescript
import { createBambooHRToolsExport } from '@clearfeed-ai/quix-bamboohr-agent';

const config = {
  apiKey: process.env.BAMBOOHR_API_KEY!,
  subdomain: 'your-company-subdomain'
};

const toolsConfig = createBambooHRToolsExport(config);
```

## API Authentication

BambooHR uses API key authentication with HTTP Basic Auth where:

- Username: Your API key
- Password: "x" (literal string)

The integration handles this automatically using the provided API key.

## Common Time Off Type IDs

- `78`: Vacation
- `79`: Sick
- `77`: Bereavement
- `82`: COVID-19 Related Absence
- `81`: Comp/In Lieu Time
- `80`: FMLA

## Future Considerations

- **Employee Creation/Updates**: Add tools for creating and updating employee records
- **Performance Management**: Integrate with BambooHR's performance review system
- **Reports**: Add support for generating custom reports
- **Benefits Administration**: Include benefits enrollment and management tools
- **Custom Fields**: Support for company-specific custom fields
- **Webhooks**: Real-time notifications for employee and time off changes
- **Bulk Operations**: Support for bulk employee imports/updates
- **Document Management**: Employee document upload and retrieval
