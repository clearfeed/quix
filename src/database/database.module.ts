import { Module, Global } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SlackWorkspace, JiraSite } from './models';

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
        models: [SlackWorkspace, JiraSite],
        autoLoadModels: true,
        synchronize: true,
        logging: false,
      }),
    }),
    SequelizeModule.forFeature([SlackWorkspace, JiraSite]),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule { } 