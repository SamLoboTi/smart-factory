import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SensorLeitura } from './sensor-leitura.entity';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_PATH || '../smart_factory.db',
      entities: [SensorLeitura],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([SensorLeitura]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
