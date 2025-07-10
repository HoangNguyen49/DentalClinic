import { Controller, Get, Post, Param, Body, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';

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
    async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
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
}
