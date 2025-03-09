import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EncryptionService } from '../utils/encryption';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: EncryptionService,
      useFactory: (configService: ConfigService) => {
        const encryptionKey = configService.get<string>('ENCRYPTION_KEY');
        if (!encryptionKey) {
          throw new Error('ENCRYPTION_KEY environment variable is required for secure token storage');
        }
        return new EncryptionService(encryptionKey);
      },
      inject: [ConfigService],
    },
  ],
  exports: [EncryptionService],
})
export class EncryptionModule { } 