import { CacheOptions } from "@nestjs/cache-manager";
import { ConfigService } from "@nestjs/config";
import { redisStore } from "cache-manager-redis-store";

export async function cacheModuleUseFactory(
  configService: ConfigService
): Promise<CacheOptions> {
  return {
    store: redisStore,
    host: configService.get<string>('REDIS_HOST')!,
    port: parseInt(configService.get<string>('REDIS_PORT')!),
  };
}