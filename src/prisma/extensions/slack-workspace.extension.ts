import { Prisma, SlackWorkspace } from '@prisma/client';
import { EncryptionService } from '../../lib/utils/encryption';

type ExtendedSlackWorkspace = Required<SlackWorkspace>;

function decryptSlackWorkspace(workspace: ExtendedSlackWorkspace | null, encryptionService: EncryptionService): ExtendedSlackWorkspace | null {
  if (!workspace) return workspace;

  if (workspace.bot_access_token) {
    try {
      workspace.bot_access_token = encryptionService.decrypt(workspace.bot_access_token);
    } catch (error) {
      console.error('Failed to decrypt bot_access_token:', error);
    }
  }

  return workspace;
}

export const slackWorkspaceExtension = (encryptionService: EncryptionService) => Prisma.defineExtension({
  name: 'slack-workspace-extension',
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
        return decryptSlackWorkspace(result as ExtendedSlackWorkspace, encryptionService);
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
        return decryptSlackWorkspace(result as ExtendedSlackWorkspace, encryptionService);
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
        return decryptSlackWorkspace(result as ExtendedSlackWorkspace, encryptionService);
      },

      async findUnique({ args, query }) {
        const result = await query(args);
        return decryptSlackWorkspace(result as ExtendedSlackWorkspace, encryptionService);
      },

      async findFirst({ args, query }) {
        const result = await query(args);
        return decryptSlackWorkspace(result as ExtendedSlackWorkspace, encryptionService);
      },

      async findMany({ args, query }) {
        const result = await query(args);
        return Array.isArray(result)
          ? result.map(item => decryptSlackWorkspace(item as ExtendedSlackWorkspace, encryptionService))
          : result;
      }
    }
  }
});