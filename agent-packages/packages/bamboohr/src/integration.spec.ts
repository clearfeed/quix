// Skip BambooHR integration tests when required environment variables are missing.
// If BAMBOOHR_API_KEY is not set, the entire suite will be skipped so CI can run without secrets.

import { BambooHRService, createBambooHRToolsExport, BambooHRConfig } from './index';

// Determine whether we have the necessary credentials to run live API tests
const hasCredentials = Boolean(process.env.BAMBOOHR_API_KEY && process.env.BAMBOOHR_API_KEY.trim());

// Use `describe.skip` when credentials are absent to avoid failing the pipeline
const describeOrSkip = hasCredentials ? describe : describe.skip;

describeOrSkip('BambooHR Integration Tests', () => {
  let service: BambooHRService;
  let config: BambooHRConfig;

  beforeAll(() => {
    config = {
      apiKey: process.env.BAMBOOHR_API_KEY || '',
      subdomain: process.env.BAMBOOHR_SUBDOMAIN || 'clearfeed'
    };

    if (!config.apiKey) {
      throw new Error('BAMBOOHR_API_KEY environment variable is required for integration tests');
    }

    service = new BambooHRService(config);
  });

  describe('Employee Management', () => {
    test('should list all employees', async () => {
      const result = await service.listEmployees();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.employees).toBeInstanceOf(Array);
      expect(result.data?.fields).toBeInstanceOf(Array);

      if (result.data?.employees && result.data.employees.length > 0) {
        const employee = result.data.employees[0];
        expect(employee.id).toBeDefined();
        expect(employee.displayName).toBeDefined();
        expect(employee.workEmail).toBeDefined();
      }
    });

    test('should get individual employee details', async () => {
      const employees = await service.listEmployees();

      if (employees.success && employees.data?.employees && employees.data.employees.length > 0) {
        const employeeId = employees.data.employees[0].id;
        const employee = await service.getEmployee({ employeeId });

        expect(employee.success).toBe(true);
        expect(employee.data).toBeDefined();
        expect(employee.data?.id).toBe(employeeId);
        expect(employee.data?.firstName).toBeDefined();
        expect(employee.data?.lastName).toBeDefined();
        expect(employee.data?.jobTitle).toBeDefined();
      }
    });
  });

  describe('Time Off Management', () => {
    test('should get employee time off balance', async () => {
      const employees = await service.listEmployees();

      if (employees.success && employees.data?.employees && employees.data.employees.length > 0) {
        const employeeId = employees.data.employees[0].id;
        const balances = await service.getEmployeeTimeOffBalance({ employeeId });

        expect(balances.success).toBe(true);
        expect(balances.data).toBeInstanceOf(Array);

        if (balances.data && balances.data.length > 0) {
          const balance = balances.data[0];
          expect(balance.timeOffType).toBeDefined();
          expect(balance.name).toBeDefined();
          expect(balance.balance).toBeDefined();
          expect(balance.units).toBeDefined();
        }
      }
    });

    test('should get time off requests with employee filter', async () => {
      const employees = await service.listEmployees();

      if (employees.success && employees.data?.employees && employees.data.employees.length > 0) {
        const employeeId = employees.data.employees[0].id;
        const requests = await service.getTimeOffRequests({ employeeId, limit: 20 });

        expect(requests.success).toBe(true);
        expect(requests.data).toBeInstanceOf(Array);

        if (requests.data && requests.data.length > 0) {
          const request = requests.data[0];
          expect(request.id).toBeDefined();
          expect(request.employeeId).toBeDefined();
          expect(request.name).toBeDefined();
          expect(request.start).toBeDefined();
          expect(request.end).toBeDefined();
          expect(request.status).toBeDefined();
          expect(request.type).toBeDefined();
        }
      }
    });

    test('should get time off requests with date range filter', async () => {
      const employees = await service.listEmployees();

      if (employees.success && employees.data?.employees && employees.data.employees.length > 0) {
        const employeeId = employees.data.employees[0].id;
        const requests = await service.getTimeOffRequests({
          employeeId,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          limit: 20
        });

        expect(requests.success).toBe(true);
        expect(requests.data).toBeInstanceOf(Array);
      }
    });

    test('should handle non-existent employee ID', async () => {
      const requests = await service.getTimeOffRequests({ employeeId: 999999, limit: 20 });

      // Should succeed but return empty array or handle gracefully
      expect(requests.success).toBe(true);
      expect(requests.data).toBeInstanceOf(Array);
    });

    test('should get time off types', async () => {
      const types = await service.getTimeOffTypes();

      expect(types.success).toBe(true);
      expect(types.data).toBeInstanceOf(Array);
      if (types.data && types.data.length > 0) {
        const firstType = types.data[0];
        expect(firstType.id).toBeDefined();
        expect(firstType.name).toBeDefined();
        expect(firstType.units).toBeDefined();
        expect(firstType.icon).toBeDefined();
        expect(['string', 'object']).toContain(typeof firstType.color);
      }
    });
  });

  describe('Tools Export', () => {
    test('should create tools export with valid config', () => {
      const toolsConfig = createBambooHRToolsExport(config);

      expect(toolsConfig).toBeDefined();
      expect(toolsConfig.toolConfigs).toBeInstanceOf(Array);
      expect(toolsConfig.toolConfigs.length).toBeGreaterThan(0);
      expect(toolsConfig.prompts).toBeDefined();
      expect(toolsConfig.prompts?.toolSelection).toBeDefined();
      expect(toolsConfig.prompts?.responseGeneration).toBeDefined();

      const toolNames = toolsConfig.toolConfigs.map((t) => t.tool.name);
      expect(toolNames).toContain('list_bamboohr_employees');
      expect(toolNames).toContain('get_bamboohr_employee');
      expect(toolNames).toContain('get_bamboohr_employee_time_off_balance');
      expect(toolNames).toContain('get_bamboohr_time_off_requests_for_employee');
      expect(toolNames).toContain('get_bamboohr_time_off_types');
      expect(toolNames).toContain('create_bamboohr_time_off_request');
    });
  });
});
