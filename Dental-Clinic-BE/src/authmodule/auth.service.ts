import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { UserPayload } from '../users/users.interface'; 

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<UserPayload> {
    const user = await this.usersService.findByUsername(username);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid password');
    }

    return {
      userId: user.userId,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
    };
  }

  async login(payload: UserPayload) {
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
