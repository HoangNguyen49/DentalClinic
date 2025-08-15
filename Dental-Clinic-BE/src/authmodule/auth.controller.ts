import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

/**
 * AuthController
 * - Xử lý đăng nhập thường, refresh token, và OAuth Google.
 * - Lưu ý bảo mật: hạn chế trả token trên URL; ưu tiên httpOnly cookie.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   * - Đăng nhập với username/password.
   * - Trả về access_token + refresh_token (tuỳ implement trong AuthService).
   */
  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    // Validate user credentials -> nhận payload (claims rút gọn)
    const payload = await this.authService.validateUser(
      loginUserDto.username,
      loginUserDto.password,
    );
    // Ký JWT & trả token
    return this.authService.login(payload);
  }

  /**
   * POST /auth/refresh
   * - Cấp mới access_token từ refresh_token.
   * - Nên dùng DTO & class-validator cho refresh_token.
   */
  @Post('refresh')
  async refresh(@Body() body: { refresh_token: string }) {
    if (!body?.refresh_token) {
      throw new BadRequestException('refresh_token is required');
    }
    return this.authService.refresh(body.refresh_token);
  }

  /**
   * GET /auth/google
   * - Bắt đầu flow OAuth Google (Passport sẽ redirect).
   * - Có thể thêm "state" để chống CSRF/forgery.
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // No-op: Passport sẽ handle redirect sang Google
  }

  /**
   * GET /auth/google/callback
   * - Google redirect về đây sau khi user grant.
   * - Passport sẽ gắn user đã xác thực lên req.user.
   * - Tạo token và trả về cho FE (query hoặc cookie).
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user: any = req.user;

    // Chuẩn hoá payload cho JWT (chỉ chứa claims cần thiết)
    const payload = {
      userId: user.userId ?? user.id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
    };

    // Ký token
    const tokens = await this.authService.login(payload);

    // Encode thông tin user tối thiểu để FE lưu (tránh lộ thông tin nhạy cảm)
    const encodedUser = encodeURIComponent(
      JSON.stringify({
        userId: payload.userId,
        username: payload.username,
        role: payload.role,
      }),
    );

    const clientUrl = process.env.CLIENT_URL;
    if (!clientUrl) {
      throw new Error('CLIENT_URL is not defined in environment variables.');
    }

    /**
     * CÁCH 1: redirect kèm token trên URL.
     * Ưu: đơn giản. Nhược: token xuất hiện trong history/log/referrer.
     * -> Nếu giữ cách này, cân nhắc chuyển token sang hash (#) thay vì query (?),
     *    hoặc đổi sang POST message từ trang trung gian.
     */
    res.redirect(
      `${clientUrl}/google-success?token=${tokens.access_token}&refresh=${tokens.refresh_token}&user=${encodedUser}`,
    );

    /**
     * CÁCH 2: Set httpOnly cookie rồi redirect "sạch".
     * Bật đoạn dưới và tắt cách 1 nếu bạn đã serve cùng domain/subdomain.
     *
     * res.cookie('access_token', tokens.access_token, {
     *   httpOnly: true,
     *   secure: true,             // bật khi dùng HTTPS
     *   sameSite: 'lax',          // hoặc 'none' nếu cross-site + HTTPS
     *   maxAge: 15 * 60 * 1000,   // 15 phút
     * });
     * res.cookie('refresh_token', tokens.refresh_token, {
     *   httpOnly: true,
     *   secure: true,
     *   sameSite: 'lax',
     *   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
     * });
     * res.redirect(`${clientUrl}/google-success`);
     */
  }
}
