import { Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Post } from '@nestjs/common';
import { UserService } from './user.service.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.getById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  @Post()
  create(@Body() body: { name: string; email: string }) {
    return this.userService.create(body);
  }
}
