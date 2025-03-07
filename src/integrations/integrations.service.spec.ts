import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationsInstallService } from './integrations-install.service';

describe('IntegrationsService', () => {
  let service: IntegrationsInstallService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntegrationsInstallService],
    }).compile();

    service = module.get<IntegrationsInstallService>(IntegrationsInstallService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
