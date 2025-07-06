import { Controller, Get, Post, Param, Body, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    async createUser(@Body() createUserDto: CreateUserDto) {
        return await this.usersService.createUser(createUserDto);
    }

    @Get()
    async findAll() {
        return await this.usersService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.usersService.findOne(+id);
    }

    @Patch(':id')
    async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return await this.usersService.updateUser(+id, updateUserDto);
    }

    @Patch(':id/deactivate')
    async deactivateUser(@Param('id') id: string) {
        return await this.usersService.deactivateUser(+id);
    }

    @Patch(':id/activate')
    async activateUser(@Param('id') id: string) {
        return await this.usersService.activateUser(+id);
    }
}
