import { Prisma, JiraSites } from '@prisma/client';
import { EncryptionService } from '../../lib/utils/encryption';

type ExtendedJiraSites = Required<JiraSites>;

function decryptJiraSites(site: ExtendedJiraSites | null, encryptionService: EncryptionService): ExtendedJiraSites | null {
  if (!site) return site;

  try {
    if (site.access_token) {
      site.access_token = encryptionService.decrypt(site.access_token);
    }
    if (site.refresh_token) {
      site.refresh_token = encryptionService.decrypt(site.refresh_token);
    }
  } catch (error) {
    console.error('Failed to decrypt Jira tokens:', error);
  }

  return site;
}

export const jiraSitesExtension = (encryptionService: EncryptionService) => Prisma.defineExtension({
  name: 'jira-sites-extension',
  query: {
    jiraSites: {
      async create({ args, query }) {
        if (args.data.access_token) {
          const accessToken = typeof args.data.access_token === 'string'
            ? args.data.access_token
            : (args.data.access_token as Prisma.StringFieldUpdateOperationsInput).set;

          if (accessToken) {
            args.data.access_token = encryptionService.encrypt(accessToken);
          }
        }

        if (args.data.refresh_token) {
          const refreshToken = typeof args.data.refresh_token === 'string'
            ? args.data.refresh_token
            : (args.data.refresh_token as Prisma.StringFieldUpdateOperationsInput).set;

          if (refreshToken) {
            args.data.refresh_token = encryptionService.encrypt(refreshToken);
          }
        }

        const result = await query(args);
        return decryptJiraSites(result as ExtendedJiraSites, encryptionService);
      },

      async update({ args, query }) {
        if (args.data.access_token) {
          const accessToken = typeof args.data.access_token === 'string'
            ? args.data.access_token
            : (args.data.access_token as Prisma.StringFieldUpdateOperationsInput).set;

          if (accessToken) {
            args.data.access_token = encryptionService.encrypt(accessToken);
          }
        }

        if (args.data.refresh_token) {
          const refreshToken = typeof args.data.refresh_token === 'string'
            ? args.data.refresh_token
            : (args.data.refresh_token as Prisma.StringFieldUpdateOperationsInput).set;

          if (refreshToken) {
            args.data.refresh_token = encryptionService.encrypt(refreshToken);
          }
        }

        const result = await query(args);
        return decryptJiraSites(result as ExtendedJiraSites, encryptionService);
      },

      async upsert({ args, query }) {
        if (args.create.access_token) {
          const createAccessToken = typeof args.create.access_token === 'string'
            ? args.create.access_token
            : '';

          if (createAccessToken) {
            args.create.access_token = encryptionService.encrypt(createAccessToken);
          }
        }

        if (args.create.refresh_token) {
          const createRefreshToken = typeof args.create.refresh_token === 'string'
            ? args.create.refresh_token
            : '';

          if (createRefreshToken) {
            args.create.refresh_token = encryptionService.encrypt(createRefreshToken);
          }
        }

        if (args.update.access_token) {
          const updateAccessToken = typeof args.update.access_token === 'string'
            ? args.update.access_token
            : (args.update.access_token as Prisma.StringFieldUpdateOperationsInput).set;

          if (updateAccessToken) {
            args.update.access_token = encryptionService.encrypt(updateAccessToken);
          }
        }

        if (args.update.refresh_token) {
          const updateRefreshToken = typeof args.update.refresh_token === 'string'
            ? args.update.refresh_token
            : (args.update.refresh_token as Prisma.StringFieldUpdateOperationsInput).set;

          if (updateRefreshToken) {
            args.update.refresh_token = encryptionService.encrypt(updateRefreshToken);
          }
        }

        const result = await query(args);
        return decryptJiraSites(result as ExtendedJiraSites, encryptionService);
      },

      async findUnique({ args, query }) {
        const result = await query(args);
        return decryptJiraSites(result as ExtendedJiraSites, encryptionService);
      },

      async findFirst({ args, query }) {
        const result = await query(args);
        return decryptJiraSites(result as ExtendedJiraSites, encryptionService);
      },

      async findMany({ args, query }) {
        const result = await query(args);
        return Array.isArray(result)
          ? result.map(item => decryptJiraSites(item as ExtendedJiraSites, encryptionService))
          : result;
      }
    }
  }
}); 