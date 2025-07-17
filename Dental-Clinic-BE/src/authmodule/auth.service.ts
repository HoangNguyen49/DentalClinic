import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { UserPayload, UserRole } from '../users/users.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  // Tạm lưu refresh tokens nếu bạn chưa muốn lưu DB
  private refreshTokens: Record<string, string> = {};

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
      throw new UnauthorizedException('Invalid password, plese try again');
    }

    return {
      userId: user.userId,
      username: user.username,
      role: user.role as UserRole,
      isActive: user.isActive,
    };
  }

  async login(payload: UserPayload) {
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = uuidv4();
    this.refreshTokens[refreshToken] = JSON.stringify(payload);
    const user = await this.usersService.findByUsername(payload.username);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        userId: user.userId,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,  
      }
    };
  }

  async refresh(refreshToken: string) {
    const payloadString = this.refreshTokens[refreshToken];
    if (!payloadString) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload: UserPayload = JSON.parse(payloadString);
    const newAccessToken = this.jwtService.sign(payload, { expiresIn: '1h' });

    return {
      access_token: newAccessToken,
    };
  }


}
