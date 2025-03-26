import { Module, Global } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as models from './models';

@Global()
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          dialect: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          models: Object.values(models),
          autoLoadModels: true,
          synchronize: false,
          logging: process.env.NODE_ENV === 'production' ? false : console.log,
          ...process.env.NODE_ENV === 'production' ? {
            dialectOptions: {
              ssl: {
                require: true,
                rejectUnauthorized: false,
              }
            },
          } : {}
        }
      },
    }),
    SequelizeModule.forFeature(Object.values(models)),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule { } 