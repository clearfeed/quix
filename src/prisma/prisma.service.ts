import { Injectable, OnModuleInit, Global, Module } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { EncryptionService } from '../lib/utils/encryption';
import { slackWorkspaceExtension } from './extensions/slack-workspace.extension';
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {

  constructor(encryptionService: EncryptionService) {
    super();

    // Use client extensions as recommended by Prisma
    Object.assign(this, this.$extends(slackWorkspaceExtension(encryptionService)));
  }

  async onModuleInit() {
    await this.$connect();
  }
}

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule { }