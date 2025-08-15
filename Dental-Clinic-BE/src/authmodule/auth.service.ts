import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { UserPayload, UserRole } from '../users/users.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  /**
   * Bộ nhớ tạm giữ refresh token -> payload (stringified)
   * Lưu ý: Chỉ nên dùng trong dev. Production nên lưu DB + có TTL/jti/rotate.
   */
  private refreshTokens: Record<string, string> = {};

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Xác thực tài khoản bằng username/password.
   * - Kiểm tra user tồn tại + đang active
   * - So khớp bcrypt
   * - Trả về payload rút gọn (claims) để ký JWT
   */
  async validateUser(username: string, password: string): Promise<UserPayload> {
    const user = await this.usersService.findByUsername(username);

    // Ẩn chi tiết để tránh lộ thông tin: chỉ báo not found/deactivated
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    // So khớp mật khẩu
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      // typo "plese" -> "please"
      throw new UnauthorizedException('Invalid password, please try again');
    }

    // Chuẩn hoá payload cho JWT
    return {
      userId: user.userId,
      username: user.username,
      role: user.role as UserRole,
      isActive: user.isActive,
    };
  }

  /**
   * Đăng nhập:
   * - Ký access token (ngắn hạn)
   * - Phát refresh token (UUID tạm thời, map vào payload trong bộ nhớ)
   * - Trả thêm thông tin user cơ bản cho FE hiển thị
   */
  async login(payload: UserPayload) {
    // Tạo access token (nên cấu hình expiresIn qua JwtModule options / env)
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });

    // Tạo refresh token (UUID). Dev: lưu RAM. Prod: lưu DB/Redis + TTL.
    const refreshToken = uuidv4();
    this.refreshTokens[refreshToken] = JSON.stringify(payload);

    // Lấy lại user để trả thông tin hiển thị
    const user = await this.usersService.findByUsername(payload.username);
    if (!user) {
      // Về lý thuyết không xảy ra, nhưng kiểm tra phòng ngừa.
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
      },
    };
  }

  /**
   * Refresh access token:
   * - Nhận refreshToken, tra payload đã lưu
   * - Ký access token mới
   * - (Dev) không rotate; (Prod) nên rotate + revoke cũ
   */
  async refresh(refreshToken: string) {
    const payloadString = this.refreshTokens[refreshToken];
    if (!payloadString) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload: UserPayload = JSON.parse(payloadString);

    // Ký access token mới
    const newAccessToken = this.jwtService.sign(payload, { expiresIn: '1h' });

    return { access_token: newAccessToken };
  }
}
