import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mssql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['dist/src/entities/*.js'],
  migrations: ['dist/src/migration/*.js'],
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
});
