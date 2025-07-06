import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
// This DTO is used for user login, ensuring that the username and password are provided as strings.
// It can be extended with additional validation rules as needed, such as checking for minimum length or specific formats.
