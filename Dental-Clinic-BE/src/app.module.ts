import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: ' localhost',
      port: 1433,
      username: 'sa',
      password: '123',
      database: 'DentalClinicDB',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // Set to false in production
      options: {
        encrypt: false, // Use true if using Azure SQL
        trustServerCertificate: true, // Use true for local development
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
