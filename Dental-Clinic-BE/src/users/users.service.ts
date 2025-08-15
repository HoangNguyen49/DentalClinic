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

/**
 * UsersService
 *  - Chịu trách nhiệm CRUD cho User và các thao tác liên quan:
 *    tạo tài khoản, cập nhật thông tin, kích hoạt/vô hiệu hoá,
 *    đổi mật khẩu, cập nhật avatar, sinh mã code theo role.
 */
@Injectable()
export class UsersService {
  // Inject repository của entity User để thao tác DB
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Tạo mới user
   * - Validate trùng username/email
   * - Hash password
   * - Set avatar mặc định nếu thiếu
   * - Sinh mã code theo role (AD/DT/PT...)
   */
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // 1) Kiểm tra trùng username
    const existingUser = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });
    if (existingUser) {
      throw new BadRequestException('Username already exists.');
    }

    // 2) Kiểm tra trùng email
    const existingEmail = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingEmail) {
      throw new BadRequestException('Email already exists.');
    }

    // 3) Băm (hash) password để không lưu plain text
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // 4) Gán avatar mặc định nếu client không gửi avatarUrl
    const avatarUrl =
      createUserDto.avatarUrl ||
      `${process.env.SERVER_URL}/uploads/default-avatar.png`;

    // 5) Tạo entity mới từ DTO
    const newUser = this.userRepository.create({
      ...createUserDto,
      avatarUrl,
      passwordHash: hashedPassword, // lưu vào cột passwordHash
    });

    // 6) Sinh mã code theo role (vd: AD01, DT03...)
    newUser.code = await this.generateUserCode(newUser.role);

    // 7) Lưu DB và trả về user đã tạo
    return await this.userRepository.save(newUser);
  }

  /**
   * Lấy danh sách toàn bộ user
   */
  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  /**
   * Lấy chi tiết một user theo id
   * - Ném NotFound nếu không tồn tại
   */
  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ userId: id });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Tìm user theo username (phục vụ auth)
   * - Trả về null nếu không có
   */
  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { username },
    });
  }

  /**
   * Cập nhật thông tin user
   * - Merge DTO vào entity
   * - Nếu chưa có code hoặc role đổi -> sinh lại code
   */
  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    // 1) Lấy entity hiện có (có sẵn check NotFound)
    const user = await this.findOne(id);

    // 2) Gộp các field từ DTO vào entity
    Object.assign(user, updateUserDto);

    // 3) Nếu chưa có code hoặc role thay đổi -> sinh lại code phù hợp
    if (!user.code || updateUserDto.role) {
      user.code = await this.generateUserCode(user.role);
    }

    // 4) Lưu và trả về
    return await this.userRepository.save(user);
  }

  /**
   * Sinh mã code theo role
   * - admin  -> AD
   * - doctor -> DT
   * - user   -> PT (patient)
   * - mặc định -> XX
   * - Dạng: PREFIX + số thứ tự 2 chữ số (ví dụ AD01, DT02)
   *   (đếm số user hiện có theo role để suy ra số tiếp theo)
   */
  private async generateUserCode(role: string): Promise<string> {
    // Chuẩn hoá prefix theo role
    let prefix = '';
    switch (role.toLowerCase()) {
      case 'admin':
        prefix = 'AD';
        break;
      case 'doctor':
        prefix = 'DT';
        break;
      case 'user':
        prefix = 'PT';
        break;
      default:
        prefix = 'XX';
    }

    // Đếm số user theo role để lấy số thứ tự tiếp theo
    const count = await this.userRepository.count({ where: { role } });
    const nextNumber = count + 1;

    // Pad trái 2 chữ số: 1 -> "01", 12 -> "12"
    const padded = nextNumber.toString().padStart(2, '0');

    return `${prefix}${padded}`;
  }

  /**
   * Vô hiệu hoá user (isActive = false)
   */
  async deactivateUser(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = false;
    return await this.userRepository.save(user);
  }

  /**
   * Kích hoạt user (isActive = true)
   */
  async activateUser(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = true;
    return await this.userRepository.save(user);
  }

  /**
   * Tìm user theo email (phục vụ các nghiệp vụ khác)
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  /**
   * Cập nhật avatar của user
   */
  async updateAvatar(id: number, avatarUrl: string): Promise<User> {
    const user = await this.findOne(id);
    user.avatarUrl = avatarUrl;
    return await this.userRepository.save(user);
  }

  /**
   * Đổi mật khẩu
   * - Kiểm tra user tồn tại
   * - So sánh oldPassword với passwordHash
   * - Không cho phép đặt newPassword giống oldPassword
   * - Hash newPassword rồi lưu
   */
  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
  ): Promise<string> {
    // 1) Tìm user theo id
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) throw new NotFoundException('User not found');

    // 2) So sánh mật khẩu cũ
    const isMatch = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!isMatch) throw new BadRequestException('Old password is incorrect');

    // 3) Chặn đặt mật khẩu mới trùng mật khẩu cũ
    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException('New password must not match old password');
    }

    // 4) Hash mật khẩu mới và lưu
    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);

    return 'Password updated successfully';
  }
}
