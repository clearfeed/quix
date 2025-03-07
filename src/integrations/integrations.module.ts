import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsInstallService } from './integrations-install.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsInstallService],
  exports: [IntegrationsInstallService]
})
export class IntegrationsModule { }
