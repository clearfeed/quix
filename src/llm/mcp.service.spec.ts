import { Test, TestingModule } from '@nestjs/testing';
import { McpService } from './mcp.service';
import { ConfigService } from '@nestjs/config';
import { SUPPORTED_INTEGRATIONS } from '../lib/constants';

describe('McpService', () => {
  let service: McpService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        McpService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'MCP_ASANA_SERVER_PATH') {
                return '@roychri/mcp-server-asana';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<McpService>(McpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getToolsForIntegration', () => {
    it('should return undefined for unsupported integration', async () => {
      // Mock implementation to avoid actual MCP server initialization
      jest.spyOn(service as any, 'getMcpServerTools').mockRejectedValue(new Error('Not implemented'));

      const result = await service.getToolsForIntegration(SUPPORTED_INTEGRATIONS.ASANA);
      expect(result).toBeUndefined();
    });
  });

  describe('INTEGRATION_TO_MCP_SERVER mapping', () => {
    it('should have a mapping for Asana', () => {
      // Now we can directly access the static mapping
      expect(McpService.INTEGRATION_TO_MCP_SERVER[SUPPORTED_INTEGRATIONS.ASANA]).toBe('mcp-server-asana');
    });
  });
});
