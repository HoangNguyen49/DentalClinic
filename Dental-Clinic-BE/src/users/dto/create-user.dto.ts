import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  fullName: string;

  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  role: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  @IsOptional()
  avatarUrl?: string;
}
// This DTO is used for creating a new user in the system.
// It includes validation rules to ensure that the data provided is in the correct format.
