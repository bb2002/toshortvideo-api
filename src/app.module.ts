import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { StorageModule } from './components/storage/storage.module';
import { EditorModule } from './components/editor/editor.module';
import { ConverterModule } from './components/converter/converter.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASS'),
        database: configService.get('DB_NAME'),
        entities: [
          join(__dirname, '/components/**/entities/*.entity{.ts,.js}'),
        ],
        synchronize: true,
        // logging: true,
      }),
    }),
    ScheduleModule.forRoot(),
    StorageModule,
    EditorModule,
    ConverterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
