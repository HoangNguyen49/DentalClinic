import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'mssql',
  host: 'localhost',
  port: 1433,
  username: 'sa',
  password: '123',
  database: 'DentalClinicDB',
  entities: ['dist/src/entities/*.js'],
  migrations: ['dist/src/migration/*.js'],
  synchronize: false,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
});
