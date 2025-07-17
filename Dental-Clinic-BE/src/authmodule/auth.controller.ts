import { Controller, Post, Body, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    const payload = await this.authService.validateUser(
      loginUserDto.username,
      loginUserDto.password,
    );
    return this.authService.login(payload);
  }

  @Post('refresh')
  async refresh(@Body() body: { refresh_token: string }) {
    return this.authService.refresh(body.refresh_token);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Redirect to Google OAuth
  }

  @Get('google/callback')
@UseGuards(AuthGuard('google'))
async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
  const user: any = req.user;

  const payload = {
    userId: user.userId ?? user.id,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
  };

  const tokens = await this.authService.login(payload);

  const encodedUser = encodeURIComponent(JSON.stringify({
    userId: payload.userId,
    username: payload.username,
    role: payload.role,
  }));

  res.redirect(`${process.env.CLIENT_URL}/google-success?token=${tokens.access_token}&user=${encodedUser}`);
}
}
