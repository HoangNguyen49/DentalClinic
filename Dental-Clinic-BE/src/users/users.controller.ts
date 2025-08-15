import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Patch,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ParseIntPipe, // dùng để parse/validate id từ string -> number
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

/**
 * UsersController
 * - Chịu trách nhiệm expose các API user: tạo, xem, cập nhật,
 *   kích hoạt/vô hiệu hoá, upload avatar, đổi mật khẩu.
 * - Các route (trừ create) yêu cầu JWT guard.
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * POST /users
   * - Tạo tài khoản người dùng mới.
   * - Public (tuỳ mô hình có thể chuyển về chỉ admin).
   */
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.createUser(createUserDto);
  }

  /**
   * GET /users
   * - Lấy danh sách user.
   * - Yêu cầu JWT, cân nhắc chỉ cho admin.
   */
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll() {
    return await this.usersService.findAll();
  }

  /**
   * GET /users/:id
   * - Lấy chi tiết một user theo id.
   */
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.findOne(id);
  }

  /**
   * PATCH /users/:id
   * - Cập nhật thông tin user theo id.
   */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.updateUser(id, updateUserDto);
  }

  /**
   * PATCH /users/:id/deactivate
   * - Vô hiệu hoá user.
   */
  @Patch(':id/deactivate')
  @UseGuards(AuthGuard('jwt'))
  async deactivateUser(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.deactivateUser(id);
  }

  /**
   * PATCH /users/:id/activate
   * - Kích hoạt user.
   */
  @Patch(':id/activate')
  @UseGuards(AuthGuard('jwt'))
  async activateUser(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.activateUser(id);
  }

  /**
   * PATCH /users/:id/avatar
   * - Upload avatar cho user.
   * - Có JWT guard để tránh bị spam/giả mạo.
   * - Dùng Multer diskStorage; validate mimetype; giới hạn 5MB.
   */
  @Patch(':id/avatar')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads', // thư mục public (serve-static)
        filename: (req, file, callback) => {
          // Tạo filename an toàn, tránh đụng độ
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `avatar-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Chỉ cho phép các định dạng ảnh phổ biến
        if (!file.mimetype.match(/^image\/(jpeg|png|jpg|webp|gif)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }),
  )
  async uploadAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // 1) Kiểm tra có file được upload
    if (!file) throw new BadRequestException('No file uploaded');

    // 2) SERVER_URL bắt buộc phải cấu hình
    const serverUrl = process.env.SERVER_URL;
    if (!serverUrl) {
      throw new Error('SERVER_URL is not defined in environment variables.');
    }

    // 3) Tạo URL public cho avatar (phụ thuộc serve-static)
    const avatarUrl = `${serverUrl}/uploads/${file.filename}`;

    // 4) Lưu avatarUrl vào user
    const updatedUser = await this.usersService.updateAvatar(id, avatarUrl);

    return {
      message: 'Avatar uploaded successfully',
      avatarUrl,
      user: updatedUser,
    };
  }

  /**
   * PATCH /users/:id/change-password
   * - Đổi mật khẩu cho user.
   * - Yêu cầu oldPassword/newPassword/confirmPassword trong body.
   */
  @Patch(':id/change-password')
  @UseGuards(AuthGuard('jwt'))
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: { oldPassword: string; newPassword: string; confirmPassword: string },
  ) {
    const { oldPassword, newPassword, confirmPassword } = body;

    // Kiểm tra confirmPassword khớp newPassword (phòng client quên validate)
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Password confirmation does not match');
    }

    return await this.usersService.changePassword(id, {
      oldPassword,
      newPassword,
      confirmPassword,
    });
  }
}
