import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service.js';
// `import type` is required: this type appears in a decorated signature while
// `isolatedModules` + `emitDecoratorMetadata` are on.
import type { CreateUserInput } from './user.service.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getAll() {
    return this.userService.getAll();
  }

  @Post()
  create(@Body() body: CreateUserInput) {
    return this.userService.create(body);
  }
}
