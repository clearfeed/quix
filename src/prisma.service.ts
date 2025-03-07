import { Injectable, OnModuleInit, Global, Module } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { EncryptionService } from './lib/utils/encryption';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {

  constructor(encryptionService: EncryptionService) {
    super();

    // Capture the decryptSlackWorkspace method bound to this instance
    const decryptWorkspace = this.decryptSlackWorkspace.bind(this);

    // Use client extensions as recommended by Prisma
    Object.assign(this, this.$extends({
      name: 'encryption-extension',
      query: {
        slackWorkspace: {
          async create({ args, query }) {
            if (args.data.bot_access_token) {
              const token = typeof args.data.bot_access_token === 'string'
                ? args.data.bot_access_token
                : (args.data.bot_access_token as Prisma.StringFieldUpdateOperationsInput).set;

              if (token) {
                const encryptedToken = encryptionService.encrypt(token);
                args.data.bot_access_token = encryptedToken;
              }
            }

            const result = await query(args);
            return decryptWorkspace(result, encryptionService);
          },

          async update({ args, query }) {
            if (args.data.bot_access_token) {
              const token = typeof args.data.bot_access_token === 'string'
                ? args.data.bot_access_token
                : (args.data.bot_access_token as Prisma.StringFieldUpdateOperationsInput).set;

              if (token) {
                const encryptedToken = encryptionService.encrypt(token);
                args.data.bot_access_token = encryptedToken;
              }
            }

            const result = await query(args);
            return decryptWorkspace(result, encryptionService);
          },

          async upsert({ args, query }) {
            if (args.create.bot_access_token) {
              const createToken = typeof args.create.bot_access_token === 'string'
                ? args.create.bot_access_token
                : '';

              if (createToken) {
                const encryptedCreateToken = encryptionService.encrypt(createToken);
                args.create.bot_access_token = encryptedCreateToken;
              }
            }

            if (args.update.bot_access_token) {
              const updateToken = typeof args.update.bot_access_token === 'string'
                ? args.update.bot_access_token
                : (args.update.bot_access_token as Prisma.StringFieldUpdateOperationsInput).set;

              if (updateToken) {
                const encryptedUpdateToken = encryptionService.encrypt(updateToken);
                args.update.bot_access_token = encryptedUpdateToken;
              }
            }

            const result = await query(args);
            return decryptWorkspace(result, encryptionService);
          },

          async findUnique({ args, query }) {
            const result = await query(args);
            return decryptWorkspace(result, encryptionService);
          },

          async findFirst({ args, query }) {
            const result = await query(args);
            return decryptWorkspace(result, encryptionService);
          },

          async findMany({ args, query }) {
            const result = await query(args);

            if (Array.isArray(result)) {
              return result.map(item => decryptWorkspace(item, encryptionService));
            }

            return result;
          }
        }
      }
    }));
  }

  /**
   * Helper method to decrypt a SlackWorkspace object
   */
  private decryptSlackWorkspace(workspace: any, encryptionService: EncryptionService): any {
    if (!workspace) return workspace;

    if (workspace.bot_access_token) {
      try {
        workspace.bot_access_token = encryptionService.decrypt(
          workspace.bot_access_token
        );
      } catch (error) {
        // If decryption fails, log the error but don't crash
        console.error('Failed to decrypt bot_access_token:', error);
      }
    }

    return workspace;
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