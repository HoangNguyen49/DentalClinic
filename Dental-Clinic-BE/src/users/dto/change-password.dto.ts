import { IsString, MinLength, NotEquals } from 'class-validator';
import { Match } from '../validators/match.decorator';

export class ChangePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  @NotEquals('oldPassword', {
    message: 'New password must not be the same as old password',
  })
  newPassword: string;

  @IsString()
  @Match('newPassword', { message: 'Confirm password does not match' })
  confirmPassword: string;
}