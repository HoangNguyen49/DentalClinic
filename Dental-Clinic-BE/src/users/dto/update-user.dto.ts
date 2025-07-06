import { IsString, IsOptional, IsEmail, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  @IsOptional()
  avatarUrl?: string;
}
// Note: Password is not included in the update DTO for security reasons.
// If password updates are needed, a separate DTO should be created to handle password changes securely.
