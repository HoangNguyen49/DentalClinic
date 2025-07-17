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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.createUser(createUserDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll() {
    return await this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string) {
    return await this.usersService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.updateUser(+id, updateUserDto);
  }

  @Patch(':id/deactivate')
  @UseGuards(AuthGuard('jwt'))
  async deactivateUser(@Param('id') id: string) {
    return await this.usersService.deactivateUser(+id);
  }

  @Patch(':id/activate')
  @UseGuards(AuthGuard('jwt'))
  async activateUser(@Param('id') id: string) {
    return await this.usersService.activateUser(+id);
  }

  //Upload avatar
  @Patch(':id/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `avatar-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
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
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const serverUrl = process.env.SERVER_URL;
    if (!serverUrl) {
      throw new Error('SERVER_URL is not defined in environment variables.');
    }
    const avatarUrl = `${serverUrl}/uploads/${file.filename}`;
    const updatedUser = await this.usersService.updateAvatar(+id, avatarUrl);

    return {
      message: 'Avatar uploaded successfully',
      avatarUrl,
      user: updatedUser,
    };
  }
}
