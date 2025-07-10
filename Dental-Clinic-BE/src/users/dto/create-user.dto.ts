import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  IsInt,
  Matches,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsString({ message: 'Full name is required' })
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  fullName: string;

  @IsString({ message: 'Username is required' })
  @MinLength(4, { message: 'Username must be at least 4 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @IsString({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsEmail({}, { message: 'Email is invalid' })
  email: string;

  @IsOptional()
  @Matches(/^\+?[0-9\s-]{6,20}$/, {
    message: 'Phone number must be valid and between 6 to 20 characters',
  })
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Department ID must be an integer' })
  departmentId?: number;

  @IsOptional()
  @IsUrl({}, { message: 'Avatar URL must be a valid URL' })
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  role: string = 'User';
}
