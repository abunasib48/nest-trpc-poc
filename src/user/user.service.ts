import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gender, User } from './user.entity.js';

export interface CreateUserInput {
  name: string;
  email: string;
  gender: Gender;
  profession: string;
  address: string;
}

/**
 * The single business/data layer. Both the HTTP controller and the tRPC
 * router depend on this exact provider instance — there is no second
 * database implementation anywhere in the project.
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  getAll(): Promise<User[]> {
    return this.users.find({ order: { id: 'ASC' } });
  }

  getById(id: number): Promise<User | null> {
    return this.users.findOneBy({ id });
  }

  create(data: CreateUserInput): Promise<User> {
    return this.users.save(this.users.create(data));
  }
}
