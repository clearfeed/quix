import { Module, Global } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SlackWorkspace, JiraConfig, SlackUserProfile, HubspotConfig } from './models';

@Global()
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        models: [SlackWorkspace, JiraConfig, SlackUserProfile, HubspotConfig],
        autoLoadModels: true,
        synchronize: false,
        logging: process.env.NODE_ENV === 'production' ? false : console.log,
      }),
    }),
    SequelizeModule.forFeature([SlackWorkspace, JiraConfig, SlackUserProfile, HubspotConfig]),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule { } 