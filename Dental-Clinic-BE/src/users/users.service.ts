import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
  // Check username & email
  const existingUser = await this.userRepository.findOne({
    where: { username: createUserDto.username },
  });
  if (existingUser) {
    throw new BadRequestException("Username already exists.");
  }

  const existingEmail = await this.userRepository.findOne({
    where: { email: createUserDto.email },
  });
  if (existingEmail) {
    throw new BadRequestException("Email already exists.");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

  // Gán avatar mặc định nếu không có avatarUrl
  const avatarUrl = createUserDto.avatarUrl || `${process.env.SERVER_URL}/uploads/default-avatar.png`;

  const newUser = this.userRepository.create({
    ...createUserDto,
    avatarUrl,
    passwordHash: hashedPassword,
  });

  return await this.userRepository.save(newUser);
}

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ userId: id });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { username },
    });
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async deactivateUser(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = false;
    return await this.userRepository.save(user);
  }

  async activateUser(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = true;
    return await this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async updateAvatar(id: number, avatarUrl: string): Promise<User> {
  const user = await this.findOne(id);
  user.avatarUrl = avatarUrl;
  return await this.userRepository.save(user);
}

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<string> {
  const user = await this.userRepository.findOne({ where: { userId } });
  if (!user) throw new NotFoundException('User not found');

  const isMatch = await bcrypt.compare(dto.oldPassword, user.passwordHash);
  if (!isMatch) throw new BadRequestException('Old password is incorrect');

  if (dto.oldPassword === dto.newPassword) {
    throw new BadRequestException('New password must not match old password');
  }

  user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
  await this.userRepository.save(user);
  return 'Password updated successfully';
}
}
