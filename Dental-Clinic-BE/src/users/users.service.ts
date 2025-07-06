import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async createUser(createUserDto: CreateUserDto): Promise<User> {
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const newUser = this.userRepository.create({
            ...createUserDto,
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
}
